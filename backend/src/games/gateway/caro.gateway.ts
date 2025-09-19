import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { GamesService } from '../games.service';

@WebSocketGateway({ 
  namespace: '/caro', 
  cors: { origin: '*' } 
})
export class CaroGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Socket>();
  private gameRooms = new Map<string, any>();
  private waitingQueue: string[] = [];

  constructor(
    private gamesService: GamesService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.data.user = null;
        return;
      }

      const payload = this.jwtService.verify(token);
      client.data.user = {
        id: payload.sub,
        username: payload.username,
      };

      this.userSockets.set(payload.sub, client);

      client.emit('userData', {
        id: payload.sub,
        username: payload.username,
      });
    } catch (error) {
      client.data.user = null;
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.user?.id;
    if (userId) {
      this.userSockets.delete(userId);
      this.removeFromQueue(userId);
    }
  }

  @SubscribeMessage('queue.join')
  async onJoinQueue(@ConnectedSocket() client: Socket) {
    try {
      const userId = client.data.user?.id;
      if (!userId) {
        client.emit('queue.error', { message: 'Vui lòng đăng nhập để chơi online' });
        return;
      }

      if (this.waitingQueue.includes(userId)) {
        client.emit('queue.waiting', { message: 'Bạn đã trong hàng đợi...' });
        return;
      }
      
      this.waitingQueue.push(userId);
      console.log(`👤 User ${userId} joined queue. Queue length: ${this.waitingQueue.length}`);
      
      if (this.waitingQueue.length >= 2) {
        const [player1, player2] = this.waitingQueue.splice(0, 2);
        console.log(`🎮 Creating match between ${player1} and ${player2}`);
        await this.createMatch(player1, player2);
      } else {
        client.emit('queue.waiting', { message: 'Đang tìm đối thủ...' });
      }
    } catch (error) {
      console.error('Error in queue.join:', error);
      client.emit('queue.error', { message: 'Lỗi khi tham gia hàng đợi' });
    }
  }

  @SubscribeMessage('queue.leave')
  async onLeaveQueue(@ConnectedSocket() client: Socket) {
    const userId = client.data.user?.id;
    if (userId) {
      this.removeFromQueue(userId);
    }
    client.emit('queue.left', { message: 'Đã rời khỏi hàng đợi' });
  }

  @SubscribeMessage('room.makeMove')
  async onMakeMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; x: number; y: number },
  ) {
    try {
      const userId = client.data.user?.id;
      if (!userId) {
        client.emit('room.error', { message: 'Vui lòng đăng nhập để chơi' });
        return;
      }

      const { roomId, x, y } = data;
      
      const result = await this.gamesService.makeCaroMove(userId, roomId, { x, y });
      
      if (result) {
        // Broadcast to all players in room
        this.server.to(roomId).emit('room.update', {
          board: result.board,
          currentPlayer: result.currentPlayer,
          isGameOver: result.isGameOver,
          winner: result.winnerId,
        });

        if (result.isGameOver) {
          this.server.to(roomId).emit('room.end', {
            winner: result.winnerId,
          });
        }
      } else {
        client.emit('room.error', { message: 'Nước đi không hợp lệ' });
      }
    } catch (error) {
      console.error('Error in room.makeMove:', error);
      client.emit('room.error', { message: 'Lỗi khi thực hiện nước đi' });
    }
  }


  private async createMatch(player1Id: string, player2Id: string) {
    try {
      console.log(`🎮 Creating match between ${player1Id} and ${player2Id}`);
      
      const game = await this.gamesService.createCaroGame(player1Id);
      await this.gamesService.joinCaroGame(player2Id, { gameId: game._id.toString(), opponentId: player1Id });
      
      const roomId = game._id.toString();
      this.gameRooms.set(roomId, { 
        player1Id, 
        player2Id
      });

      // Join both players to room
      const player1Socket = this.userSockets.get(player1Id);
      const player2Socket = this.userSockets.get(player2Id);
      
      if (player1Socket) {
        player1Socket.join(roomId);
        player1Socket.emit('queue.matched', {
          roomId,
          symbol: 'X',
          opponent: { userId: player2Id, username: 'Opponent' },
        });
        console.log(`✅ Player 1 (${player1Id}) joined room ${roomId} as X`);
      }
      
      if (player2Socket) {
        player2Socket.join(roomId);
        player2Socket.emit('queue.matched', {
          roomId,
          symbol: 'O',
          opponent: { userId: player1Id, username: 'Opponent' },
        });
        console.log(`✅ Player 2 (${player2Id}) joined room ${roomId} as O`);
      }

      // Send initial game state
      this.server.to(roomId).emit('room.update', {
        board: game.board,
        currentPlayer: game.currentPlayer,
        isGameOver: game.isGameOver,
        winner: game.winnerId,
      });
      
      console.log(`🎮 Match created successfully: ${roomId}`);
    } catch (error) {
      console.error('Error creating match:', error);
    }
  }

  private removeFromQueue(userId: string) {
    const index = this.waitingQueue.indexOf(userId);
    if (index > -1) {
      this.waitingQueue.splice(index, 1);
    }
  }
}
