import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Line98Service, GameState } from './line98.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class Line98Gateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Socket>();
  private gameStates = new Map<string, GameState>();

  constructor(
    private line98Service: Line98Service,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      
      this.userSockets.set(userId, client);
      
      // Initialize game state if not exists
      if (!this.gameStates.has(userId)) {
        this.gameStates.set(userId, this.line98Service.createNewGame(userId));
      }

      // Send current game state
      const gameState = this.gameStates.get(userId);
      client.emit('gameState', gameState);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socket] of this.userSockets.entries()) {
      if (socket === client) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('selectBall')
  handleSelectBall(
    @MessageBody() data: { row: number; col: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    const gameState = this.gameStates.get(userId);
    if (!gameState) return;

    const newGameState = this.line98Service.selectBall(gameState, data.row, data.col);
    this.gameStates.set(userId, newGameState);
    
    client.emit('gameState', newGameState);
  }

  @SubscribeMessage('moveBall')
  handleMoveBall(
    @MessageBody() data: { fromRow: number; fromCol: number; toRow: number; toCol: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    const gameState = this.gameStates.get(userId);
    if (!gameState) return;

    const newGameState = this.line98Service.moveBall(
      gameState,
      data.fromRow,
      data.fromCol,
      data.toRow,
      data.toCol,
    );
    
    this.gameStates.set(userId, newGameState);
    client.emit('gameState', newGameState);

    // Save game if it's over
    if (newGameState.isGameOver) {
      this.line98Service.saveGame(userId, newGameState);
    }
  }

  @SubscribeMessage('getHint')
  handleGetHint(@ConnectedSocket() client: Socket) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    const gameState = this.gameStates.get(userId);
    if (!gameState) return;

    const hint = this.line98Service.getHint(gameState);
    client.emit('hint', hint);
  }

  @SubscribeMessage('newGame')
  handleNewGame(@ConnectedSocket() client: Socket) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    const newGameState = this.line98Service.createNewGame(userId);
    this.gameStates.set(userId, newGameState);
    
    client.emit('gameState', newGameState);
  }

  private getUserIdFromSocket(client: Socket): string | null {
    try {
      const token = client.handshake.auth.token;
      const payload = this.jwtService.verify(token);
      return payload.sub;
    } catch {
      return null;
    }
  }
}
