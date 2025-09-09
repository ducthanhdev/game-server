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
import { CaroService, CaroGameState } from './caro.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class CaroGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Socket>();
  private gameRooms = new Map<string, Set<string>>(); // gameId -> Set of playerIds
  private waitingPlayers = new Set<string>();

  constructor(
    private caroService: CaroService,
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
      
      // Try to find an available game or create a new one
      await this.tryMatchPlayer(userId);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socket] of this.userSockets.entries()) {
      if (socket === client) {
        this.userSockets.delete(userId);
        this.waitingPlayers.delete(userId);
        
        // Remove from game rooms
        for (const [gameId, players] of this.gameRooms.entries()) {
          if (players.has(userId)) {
            players.delete(userId);
            if (players.size === 0) {
              this.gameRooms.delete(gameId);
            } else {
              // Notify other player that opponent left
              const otherPlayerId = Array.from(players)[0];
              const otherSocket = this.userSockets.get(otherPlayerId);
              if (otherSocket) {
                otherSocket.emit('opponentLeft');
              }
            }
            break;
          }
        }
        break;
      }
    }
  }

  @SubscribeMessage('createGame')
  async handleCreateGame(@ConnectedSocket() client: Socket) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    const game = await this.caroService.createGame(userId);
    const gameId = (game as any)._id.toString();
    this.gameRooms.set(gameId, new Set([userId]));
    
    client.emit('gameCreated', { gameId });
    client.join(`game-${gameId}`);
  }

  @SubscribeMessage('joinGame')
  async handleJoinGame(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    const game = await this.caroService.joinGame(data.gameId, userId);
    if (!game) {
      client.emit('joinGameError', { message: 'Cannot join this game' });
      return;
    }

    const players = this.gameRooms.get(data.gameId) || new Set();
    players.add(userId);
    this.gameRooms.set(data.gameId, players);

    client.join(`game-${data.gameId}`);
    
    // Notify both players
    this.server.to(`game-${data.gameId}`).emit('gameJoined', {
      gameId: data.gameId,
      player1Id: game.player1Id.toString(),
      player2Id: game.player2Id.toString(),
    });

    // Send current game state
    const gameState = await this.caroService.getGame(data.gameId);
    if (gameState) {
      this.server.to(`game-${data.gameId}`).emit('gameState', gameState);
    }
  }

  @SubscribeMessage('makeMove')
  async handleMakeMove(
    @MessageBody() data: { gameId: string; row: number; col: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    const gameState = await this.caroService.makeMove(data.gameId, userId, data.row, data.col);
    if (!gameState) {
      client.emit('moveError', { message: 'Invalid move' });
      return;
    }

    // Notify both players
    this.server.to(`game-${data.gameId}`).emit('gameState', gameState);

    if (gameState.isGameOver) {
      this.server.to(`game-${data.gameId}`).emit('gameOver', {
        winnerId: gameState.winnerId,
        isDraw: gameState.winnerId === null,
      });
    }
  }

  @SubscribeMessage('findMatch')
  async handleFindMatch(@ConnectedSocket() client: Socket) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    await this.tryMatchPlayer(userId);
  }

  private async tryMatchPlayer(userId: string): Promise<void> {
    // Check if there's an available game
    const availableGame = await this.caroService.findAvailableGame();
    
    if (availableGame) {
      // Join existing game
      const availableGameId = (availableGame as any)._id.toString();
      const game = await this.caroService.joinGame(availableGameId, userId);
      if (game) {
        const players = this.gameRooms.get(availableGameId) || new Set();
        players.add(userId);
        this.gameRooms.set(availableGameId, players);

        const socket = this.userSockets.get(userId);
        if (socket) {
          socket.join(`game-${availableGameId}`);
          socket.emit('gameJoined', {
            gameId: availableGameId,
            player1Id: game.player1Id,
            player2Id: game.player2Id,
          });

          // Notify both players
          this.server.to(`game-${availableGameId}`).emit('gameJoined', {
            gameId: availableGameId,
            player1Id: game.player1Id,
            player2Id: game.player2Id,
          });

          // Send current game state
          const gameState = await this.caroService.getGame(availableGameId);
          if (gameState) {
            this.server.to(`game-${availableGameId}`).emit('gameState', gameState);
          }
        }
      }
    } else {
      // Create new game and wait for opponent
      const game = await this.caroService.createGame(userId);
      const gameId = (game as any)._id.toString();
      this.gameRooms.set(gameId, new Set([userId]));
      this.waitingPlayers.add(userId);

      const socket = this.userSockets.get(userId);
      if (socket) {
        socket.join(`game-${gameId}`);
        socket.emit('gameCreated', { gameId });
        socket.emit('waitingForOpponent');
      }
    }
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