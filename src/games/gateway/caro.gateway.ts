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
    console.log(`Caro client connected: ${client.id}`);
    
    // Xác thực JWT khi kết nối
    try {
      const token = this.extractTokenFromSocket(client);
      console.log('Extracted token:', token ? 'Token found' : 'No token');
      
      if (!token) {
        console.log('No token provided for WebSocket connection');
        client.data.user = null;
        return;
      }

      // Verify token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: 'your-secret-key',
      });

      // Gắn user vào client data
      client.data.user = {
        id: payload.sub,
        username: payload.username,
      };

      // Cập nhật socket cho user trong matchmaking service
      this.matchmakingService.updateUserSocket(payload.sub, client);

      // Gửi user data đến client
      client.emit('userData', {
        id: payload.sub,
        username: payload.username,
      });

      console.log(`WebSocket authenticated user: ${payload.sub}`);
    } catch (error) {
      console.log('WebSocket authentication failed:', error.message);
      console.log('Token that failed:', this.extractTokenFromSocket(client));
      client.data.user = null;
    }
  }

  private extractTokenFromSocket(client: Socket): string | null {
    console.log('Handshake auth:', client.handshake.auth);
    console.log('Handshake headers:', client.handshake.headers);
    console.log('Handshake query:', client.handshake.query);
    
    // Thử lấy từ auth
    if (client.handshake.auth?.token) {
      const token = client.handshake.auth.token;
      console.log('Token from auth:', token);
      return token.startsWith('Bearer ') ? token.substring(7) : token;
    }

    // Thử lấy từ headers
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      console.log('Token from headers:', authHeader);
      return authHeader.substring(7);
    }

    // Thử lấy từ query
    if (client.handshake.query?.token) {
      const token = client.handshake.query.token as string;
      console.log('Token from query:', token);
      return token.startsWith('Bearer ') ? token.substring(7) : token;
    }

    console.log('No token found in any location');
    return null;
  }

  handleDisconnect(client: Socket) {
    console.log(`Caro client disconnected: ${client.id}`);
    
    // Xóa user khỏi matchmaking queue
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

      console.log(`User ${userId} joining queue`);
      
      // Kiểm tra user đã có trong queue chưa
      const queueInfo = this.matchmakingService.getQueueInfo();
      if (queueInfo.users.includes(userId)) {
        console.log(`User ${userId} already in queue`);
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
      console.log(`Found ${sockets.length} sockets for users [${xUserId}, ${oUserId}]`);
      sockets.forEach(socket => {
        console.log(`Joining room ${roomState.roomId} for socket ${socket.id}`);
        socket.join(roomState.roomId);
      });

      // Thông báo đã ghép cặp
      sockets.forEach(socket => {
        const symbol = socket.data.user.id === xUserId ? 'X' : 'O';
        const opponent = socket.data.user.id === xUserId ? 
          { userId: oUserId, username: 'Opponent' } : 
          { userId: xUserId, username: 'Opponent' };

        console.log(`Sending queue.matched to ${socket.data.user.id}:`, {
          roomId: roomState.roomId,
          symbol,
          opponent,
        });

        socket.emit('queue.matched', {
          roomId: roomState.roomId,
          symbol,
          opponent,
        });

        // Gửi trạng thái ban đầu
        console.log(`Sending room.update to ${socket.data.user.id}`);
        socket.emit('room.update', {
          board: roomState.board,
          turn: roomState.turn,
          status: roomState.status,
        });
      });

      console.log(`Match created: ${xUserId} vs ${oUserId} in room ${roomState.roomId}`);
      
      // Xóa sockets khỏi matchmaking sau khi tạo phòng thành công
      this.matchmakingService.removeMatchedUsers([xUserId, oUserId]);
    } catch (error) {
      console.error('Error in queue.join:', error);
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
        
        console.log(`Game ended: ${winnerSymbol} (${winnerUserId}) won in room ${roomId}`);
      } else {
        // Bắt đầu timeout cho lượt tiếp theo
        this.caroService.startTurnTimeout(roomId, () => {
          this.handleTurnTimeout(roomId);
        });
      }
    } catch (error) {
      console.error('Error in room.makeMove:', error);
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
      
      console.log(`Game ended by resignation: ${winnerSymbol} (${winnerUserId}) won in room ${roomId}`);
    } catch (error) {
      console.error('Error in room.resign:', error);
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
      console.error('Error in room.state:', error);
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
      console.log(`Received room.newGame request from ${userId} for room ${roomId}`);
      
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
      console.log(`Looking for opponent ${opponentId}, found ${opponentSockets.length} sockets`);
      
      if (opponentSockets.length > 0) {
        const opponentSocket = opponentSockets[0];
        console.log(`Sending newGameRequest to opponent ${opponentId} (socket: ${opponentSocket.id})`);
        console.log(`Opponent socket connected: ${opponentSocket.connected}`);
        opponentSocket.emit('room.newGameRequest', {
          roomId,
          requestedBy: userId,
          message: 'Người chơi muốn tạo game mới. Bạn có đồng ý không?'
        });
      } else {
        console.log(`No socket found for opponent ${opponentId}`);
        client.emit('room.error', { code: 'OPPONENT_NOT_FOUND', message: 'Đối thủ không còn kết nối' });
        return;
      }

      // Gửi thông báo cho người yêu cầu
      client.emit('room.newGameRequestSent', {
        roomId,
        message: 'Đã gửi yêu cầu game mới. Chờ đối thủ xác nhận...'
      });

    } catch (error) {
      console.error('Error in room.newGame:', error);
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
      console.log(`Received room.confirmNewGame from ${userId} for room ${roomId}`);
      
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
        console.log(`Both players confirmed, creating new game for room ${roomId}`);
        await this.createNewGameAfterConfirmation(roomId, state);
      }

    } catch (error) {
      console.error('Error in room.confirmNewGame:', error);
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
      console.log(`Received room.rejectNewGame from ${userId} for room ${roomId}`);
      
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

      // Xóa yêu cầu game mới
      this.caroService.clearNewGameRequest(roomId);

    } catch (error) {
      console.error('Error in room.rejectNewGame:', error);
      client.emit('room.error', { code: 'REJECT_ERROR', message: 'Lỗi khi từ chối game mới' });
    }
  }

  /**
   * Tạo game mới sau khi cả 2 người xác nhận
   */
  private async createNewGameAfterConfirmation(roomId: string, oldState: any) {
    try {
      // Tạo game mới với cùng 2 người chơi
      const newRoomState = this.caroService.createRoom(oldState.players.xUserId, oldState.players.oUserId);
      
      // Xóa phòng cũ khỏi memory
      this.caroService.removeRoom(roomId);
      
      // Join room mới cho cả 2 người chơi
      const sockets = this.matchmakingService.getSockets([oldState.players.xUserId, oldState.players.oUserId]);
      console.log(`Found ${sockets.length} sockets for new game:`, sockets.map(s => s.data.user.id));
      sockets.forEach(socket => {
        console.log(`Joining new room ${newRoomState.roomId} for socket ${socket.id}`);
        socket.join(newRoomState.roomId);
      });

      // Thông báo game mới
      sockets.forEach(socket => {
        const symbol = socket.data.user.id === newRoomState.players.xUserId ? 'X' : 'O';
        const opponent = socket.data.user.id === newRoomState.players.xUserId ? 
          { userId: newRoomState.players.oUserId, username: 'Opponent' } : 
          { userId: newRoomState.players.xUserId, username: 'Opponent' };

        console.log(`Sending room.newGame to ${socket.data.user.id}:`, { 
          roomId: newRoomState.roomId, 
          symbol, 
          opponent 
        });

        socket.emit('room.newGame', {
          roomId: newRoomState.roomId,
          symbol,
          opponent,
        });

        console.log(`Sending room.update to ${socket.data.user.id}`);
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

      console.log(`New game created: ${newRoomState.players.xUserId} vs ${newRoomState.players.oUserId} in room ${newRoomState.roomId}`);
    } catch (error) {
      console.error('Error creating new game after confirmation:', error);
    }
  }

  /**
   * Xử lý khi timeout lượt đi
   */
  private handleTurnTimeout(roomId: string): void {
    try {
      console.log(`Handling turn timeout for room ${roomId}`);
      
      const state = this.caroService.getState(roomId);
      if (!state || state.status !== 'playing') {
        console.log(`Room ${roomId} not found or not playing, skipping timeout handling`);
        return;
      }

      console.log(`Turn timeout for room ${roomId}, current turn: ${state.turn}`);

      // Xác định người chơi bị timeout
      const currentPlayerId = state.turn === 1 ? state.players.xUserId : state.players.oUserId;
      const winnerId = state.turn === 1 ? state.players.oUserId : state.players.xUserId;
      const winnerSymbol = state.turn === 1 ? 'O' : 'X';

      console.log(`Timeout player: ${currentPlayerId}, Winner: ${winnerId} (${winnerSymbol})`);

      // Gửi thông báo timeout đến cả 2 người chơi
      const sockets = this.matchmakingService.getSockets([state.players.xUserId, state.players.oUserId]);
      console.log(`Found ${sockets.length} sockets for timeout notification`);
      
      sockets.forEach(socket => {
        console.log(`Sending timeout notification to socket ${socket.id}`);
        socket.emit('room.timeout', {
          roomId,
          timeoutPlayerId: currentPlayerId,
          winnerId,
          winnerSymbol,
          message: 'Đối thủ mất kết nối. Game kết thúc.'
        });
      });

      // Lưu kết quả và xóa phòng
      this.caroService.endGame(roomId, winnerId, winnerSymbol);
      
      // Xóa sockets khỏi matchmaking
      this.matchmakingService.removeMatchedUsers([state.players.xUserId, state.players.oUserId]);

      console.log(`Timeout handling completed for room ${roomId}`);

    } catch (error) {
      console.error('Error handling turn timeout:', error);
    }
  }
}
