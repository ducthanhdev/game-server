import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { GamesService } from '../games.service';

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class Line98Gateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Socket>();
  private gameStates = new Map<string, any>();

  constructor(
    private gamesService: GamesService,
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
        const game = await this.gamesService.createLine98Game(userId);
        this.gameStates.set(userId, game.gameState);
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
        this.gameStates.delete(userId);
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

    const newGameState = this.gamesService.selectBall(gameState, data.row, data.col);
    this.gameStates.set(userId, newGameState);
    
    client.emit('gameState', newGameState);
  }

  @SubscribeMessage('moveBall')
  async handleMoveBall(
    @MessageBody() data: { fromRow: number; fromCol: number; toRow: number; toCol: number; gameId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    try {
      // Use the same makeLine98Move method that has auto-save built-in
      const updatedGame = await this.gamesService.makeLine98Move(userId, data.gameId, {
        fromRow: data.fromRow,
        fromCol: data.fromCol,
        toRow: data.toRow,
        toCol: data.toCol
      });
      
      this.gameStates.set(userId, updatedGame.gameState);
      client.emit('gameState', updatedGame.gameState);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('getHint')
  handleGetHint(@ConnectedSocket() client: Socket) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    const gameState = this.gameStates.get(userId);
    if (!gameState) return;

    const hint = this.gamesService.findLine98Hint(gameState);
    client.emit('hint', hint);
  }

  @SubscribeMessage('newGame')
  async handleNewGame(@ConnectedSocket() client: Socket) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    const game = await this.gamesService.createLine98Game(userId);
    this.gameStates.set(userId, game.gameState);
    
    client.emit('gameState', game.gameState);
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
