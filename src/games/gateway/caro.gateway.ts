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
import { CaroService } from '../services/caro.service';
import { MatchmakingService } from '../services/matchmaking.service';
import { JwtWsGuard } from '../../common/guards/jwt-ws.guard';
import { WsUser } from '../../common/decorators/ws-user.decorator';
import { JoinQueueDto } from '../dto/join-queue.dto';
import { MakeMoveDto } from '../dto/make-move.dto';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ 
  namespace: '/caro', 
  cors: { origin: '*' } 
})
export class CaroGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly caroService: CaroService,
    private readonly matchmakingService: MatchmakingService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractTokenFromSocket(client);
      
      if (!token) {
        client.data.user = null;
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: 'your-secret-key',
      });

      client.data.user = {
        id: payload.sub,
        username: payload.username,
      };

      this.matchmakingService.updateUserSocket(payload.sub, client);

      client.emit('userData', {
        id: payload.sub,
        username: payload.username,
      });
    } catch (error) {
      client.data.user = null;
    }
  }

  private extractTokenFromSocket(client: Socket): string | null {
    if (client.handshake.auth?.token) {
      const token = client.handshake.auth.token;
      return token.startsWith('Bearer ') ? token.substring(7) : token;
    }

    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    if (client.handshake.query?.token) {
      const token = client.handshake.query.token as string;
      return token.startsWith('Bearer ') ? token.substring(7) : token;
    }

    return null;
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.user?.id;
    if (userId) {
      this.matchmakingService.removeUser(userId);
    }
  }

  @SubscribeMessage('queue.join')
  async onJoinQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinQueueDto,
  ) {
    try {
      // Kiểm tra authentication trực tiếp
      const userId = client.data.user?.id;
      if (!userId) {
        client.emit('queue.error', { message: 'Vui lòng đăng nhập để chơi online' });
        return;
      }

      
      // Kiểm tra user đã có trong queue chưa
      const queueInfo = this.matchmakingService.getQueueInfo();
      if (queueInfo.users.includes(userId)) {
        client.emit('queue.waiting', { message: 'Bạn đã trong hàng đợi...' });
        return;
      }
      
      // Thêm vào hàng đợi
      const opponentId = this.matchmakingService.enqueue(userId, client);
      
      if (!opponentId) {
        // Chưa có đối thủ, chờ thêm
        client.emit('queue.waiting', { message: 'Đang tìm đối thủ...' });
        return;
      }

      // Có đối thủ, tạo phòng
      const [xUserId, oUserId] = Math.random() < 0.5 ? [userId, opponentId] : [opponentId, userId];
      const roomState = this.caroService.createRoom(xUserId, oUserId);

      // Join room cho cả 2 người chơi
      const sockets = this.matchmakingService.getSockets([xUserId, oUserId]);
      sockets.forEach(socket => {
        socket.join(roomState.roomId);
      });

      // Thông báo đã ghép cặp
      sockets.forEach(socket => {
        const symbol = socket.data.user.id === xUserId ? 'X' : 'O';
        const opponent = socket.data.user.id === xUserId ? 
          { userId: oUserId, username: 'Opponent' } : 
          { userId: xUserId, username: 'Opponent' };


        socket.emit('queue.matched', {
          roomId: roomState.roomId,
          symbol,
          opponent,
        });

        // Gửi trạng thái ban đầu
        socket.emit('room.update', {
          board: roomState.board,
          turn: roomState.turn,
          status: roomState.status,
        });
      });

    } catch (error) {
      client.emit('queue.error', { message: 'Lỗi khi tham gia hàng đợi' });
    }
  }

  @SubscribeMessage('queue.leave')
  async onLeaveQueue(
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user?.id;
    if (userId) {
      this.matchmakingService.dequeue(userId);
    }
    client.emit('queue.left', { message: 'Đã rời khỏi hàng đợi' });
  }

  @SubscribeMessage('room.makeMove')
  async onMakeMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MakeMoveDto,
  ) {
    try {
      const userId = client.data.user?.id;
      if (!userId) {
        client.emit('room.error', { message: 'Vui lòng đăng nhập để chơi' });
        return;
      }

      const { roomId, x, y } = data;
      
      const result = this.caroService.makeMove(roomId, userId, x, y);
      const { state, win, winnerSymbol } = result;

      // Gửi cập nhật cho cả 2 người chơi
      this.server.to(roomId).emit('room.update', {
        board: state.board,
        turn: state.turn,
        lastMove: { x, y, by: userId },
        status: state.status,
      });

      if (win) {
        // Có người thắng
        const winnerUserId = winnerSymbol === 'X' ? state.players.xUserId : state.players.oUserId;
        
        // Dừng timeout nếu game kết thúc
        this.caroService.stopTurnTimeout(roomId);
        
        this.server.to(roomId).emit('room.end', {
          winnerUserId,
          winnerSymbol,
        });

        // Lưu kết quả vào database
        await this.caroService.endGame(roomId, winnerUserId, winnerSymbol);
        
      } else {
        // Bắt đầu timeout cho lượt tiếp theo
        this.caroService.startTurnTimeout(roomId, () => {
          this.handleTurnTimeout(roomId);
        });
      }
    } catch (error) {
      client.emit('room.error', { 
        code: error.message, 
        message: 'Nước đi không hợp lệ' 
      });
    }
  }

  @SubscribeMessage('room.resign')
  async onResign(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      const userId = client.data.user?.id;
      if (!userId) {
        client.emit('room.error', { message: 'Vui lòng đăng nhập để chơi' });
        return;
      }

      const { roomId } = data;
      const state = this.caroService.getState(roomId);
      
      if (!state) {
        client.emit('room.error', { code: 'ROOM_NOT_FOUND', message: 'Phòng không tồn tại' });
        return;
      }

      // Xác định người thắng (đối thủ)
      const winnerUserId = state.players.xUserId === userId ? state.players.oUserId : state.players.xUserId;
      const winnerSymbol = state.players.xUserId === userId ? 'O' : 'X';

      this.server.to(roomId).emit('room.end', {
        winnerUserId,
        winnerSymbol,
        reason: 'resign',
      });

      await this.caroService.endAndPersist(roomId, winnerUserId, winnerSymbol);
      
    } catch (error) {
      client.emit('room.error', { code: 'RESIGN_ERROR', message: 'Lỗi khi xin thua' });
    }
  }

  @SubscribeMessage('room.state')
  async onRoomState(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      const { roomId } = data;
      const state = this.caroService.getState(roomId);
      
      if (!state) {
        client.emit('room.error', { code: 'ROOM_NOT_FOUND', message: 'Phòng không tồn tại' });
        return;
      }

      client.emit('room.state', { fullState: state });
    } catch (error) {
      client.emit('room.error', { code: 'STATE_ERROR', message: 'Lỗi khi lấy trạng thái phòng' });
    }
  }

  @SubscribeMessage('room.newGame')
  async onNewGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      const userId = client.data.user?.id;
      if (!userId) {
        client.emit('room.error', { message: 'Vui lòng đăng nhập để chơi' });
        return;
      }

      const { roomId } = data;
      
      // Yêu cầu game mới
      const requestResult = this.caroService.requestNewGame(roomId, userId);
      
      if (!requestResult.success) {
        client.emit('room.error', { code: 'NEW_GAME_REQUEST_FAILED', message: requestResult.message });
        return;
      }

      // Gửi yêu cầu đến người chơi còn lại
      const state = this.caroService.getState(roomId);
      if (!state) {
        client.emit('room.error', { code: 'ROOM_NOT_FOUND', message: 'Phòng không tồn tại' });
        return;
      }

      const opponentId = state.players.xUserId === userId ? state.players.oUserId : state.players.xUserId;
      const opponentSockets = this.matchmakingService.getSockets([opponentId]);
      
      if (opponentSockets.length > 0) {
        const opponentSocket = opponentSockets[0];
        opponentSocket.emit('room.newGameRequest', {
          roomId,
          requestedBy: userId,
          message: 'Người chơi muốn tạo game mới. Bạn có đồng ý không?'
        });
      } else {
        client.emit('room.error', { code: 'OPPONENT_NOT_FOUND', message: 'Đối thủ không còn kết nối' });
        return;
      }

      // Gửi thông báo cho người yêu cầu
      client.emit('room.newGameRequestSent', {
        roomId,
        message: 'Đã gửi yêu cầu game mới. Chờ đối thủ xác nhận...'
      });

    } catch (error) {
      client.emit('room.error', { code: 'NEW_GAME_ERROR', message: 'Lỗi khi yêu cầu game mới' });
    }
  }

  @SubscribeMessage('room.confirmNewGame')
  async onConfirmNewGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      const userId = client.data.user?.id;
      if (!userId) {
        client.emit('room.error', { message: 'Vui lòng đăng nhập để chơi' });
        return;
      }

      const { roomId } = data;
      
      // Xác nhận game mới
      const confirmResult = this.caroService.confirmNewGame(roomId, userId);
      
      if (!confirmResult.success) {
        client.emit('room.error', { code: 'CONFIRM_FAILED', message: confirmResult.message });
        return;
      }

      const state = this.caroService.getState(roomId);
      if (!state) {
        client.emit('room.error', { code: 'ROOM_NOT_FOUND', message: 'Phòng không tồn tại' });
        return;
      }

      // Gửi thông báo cho cả 2 người chơi
      const sockets = this.matchmakingService.getSockets([state.players.xUserId, state.players.oUserId]);
      sockets.forEach(socket => {
        socket.emit('room.newGameConfirmed', {
          roomId,
          confirmedBy: userId,
          message: confirmResult.message
        });
      });

      // Nếu cả 2 người đã xác nhận, tạo game mới
      if (confirmResult.shouldCreate) {
        await this.createNewGameAfterConfirmation(roomId, state);
      }

    } catch (error) {
      client.emit('room.error', { code: 'CONFIRM_ERROR', message: 'Lỗi khi xác nhận game mới' });
    }
  }

  @SubscribeMessage('room.rejectNewGame')
  async onRejectNewGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      const userId = client.data.user?.id;
      if (!userId) {
        client.emit('room.error', { message: 'Vui lòng đăng nhập để chơi' });
        return;
      }

      const { roomId } = data;
      
      // Từ chối game mới
      const rejectResult = this.caroService.rejectNewGame(roomId, userId);
      
      if (!rejectResult.success) {
        client.emit('room.error', { code: 'REJECT_FAILED', message: rejectResult.message });
        return;
      }

      const state = this.caroService.getState(roomId);
      if (!state) {
        client.emit('room.error', { code: 'ROOM_NOT_FOUND', message: 'Phòng không tồn tại' });
        return;
      }

      // Gửi thông báo cho cả 2 người chơi
      const sockets = this.matchmakingService.getSockets([state.players.xUserId, state.players.oUserId]);
      sockets.forEach(socket => {
        socket.emit('room.newGameRejected', {
          roomId,
          rejectedBy: userId,
          message: 'Đối thủ đã từ chối game mới. Thoát chế độ online.'
        });
      });

      this.caroService.clearNewGameRequest(roomId);

    } catch (error) {
      client.emit('room.error', { code: 'REJECT_ERROR', message: 'Lỗi khi từ chối game mới' });
    }
  }

  private async createNewGameAfterConfirmation(roomId: string, oldState: any) {
    try {
      // Tạo game mới với cùng 2 người chơi
      const newRoomState = this.caroService.createRoom(oldState.players.xUserId, oldState.players.oUserId);
      
      // Xóa phòng cũ khỏi memory
      this.caroService.removeRoom(roomId);
      
      // Join room mới cho cả 2 người chơi
      const sockets = this.matchmakingService.getSockets([oldState.players.xUserId, oldState.players.oUserId]);
      sockets.forEach(socket => {
        socket.join(newRoomState.roomId);
      });

      // Thông báo game mới
      sockets.forEach(socket => {
        const symbol = socket.data.user.id === newRoomState.players.xUserId ? 'X' : 'O';
        const opponent = socket.data.user.id === newRoomState.players.xUserId ? 
          { userId: newRoomState.players.oUserId, username: 'Opponent' } : 
          { userId: newRoomState.players.xUserId, username: 'Opponent' };


        socket.emit('room.newGame', {
          roomId: newRoomState.roomId,
          symbol,
          opponent,
        });

        socket.emit('room.update', {
          board: newRoomState.board,
          turn: newRoomState.turn,
          status: newRoomState.status,
        });
      });

      // Bắt đầu timeout cho lượt đầu tiên (X đi trước)
      this.caroService.startTurnTimeout(newRoomState.roomId, () => {
        this.handleTurnTimeout(newRoomState.roomId);
      });

    } catch (error) {
    }
  }

  private handleTurnTimeout(roomId: string): void {
    try {
      
      const state = this.caroService.getState(roomId);
      if (!state || state.status !== 'playing') {
        return;
      }


      // Xác định người chơi bị timeout
      const currentPlayerId = state.turn === 1 ? state.players.xUserId : state.players.oUserId;
      const winnerId = state.turn === 1 ? state.players.oUserId : state.players.xUserId;
      const winnerSymbol = state.turn === 1 ? 'O' : 'X';


      // Gửi thông báo timeout đến cả 2 người chơi
      const sockets = this.matchmakingService.getSockets([state.players.xUserId, state.players.oUserId]);
      
      sockets.forEach(socket => {
        socket.emit('room.timeout', {
          roomId,
          timeoutPlayerId: currentPlayerId,
          winnerId,
          winnerSymbol,
          message: 'Đối thủ mất kết nối. Game kết thúc.'
        });
      });

      this.caroService.endGame(roomId, winnerId, winnerSymbol);
      


    } catch (error) {
    }
  }
}
