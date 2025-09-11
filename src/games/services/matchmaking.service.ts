import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

interface QueuedUser {
  userId: string;
  socket: Socket;
  joinedAt: number;
}

@Injectable()
export class MatchmakingService {
  private queue: QueuedUser[] = [];
  private userSocketMap = new Map<string, Socket>();

  /**
   * Thêm user vào hàng đợi
   * @param userId ID của user
   * @param socket Socket connection
   * @returns Đối thủ nếu có, null nếu chưa có
   */
  enqueue(userId: string, socket: Socket): string | null {
    // Kiểm tra user đã có trong queue chưa
    const existingIndex = this.queue.findIndex(u => u.userId === userId);
    if (existingIndex !== -1) {
      // Cập nhật socket nếu user đã có trong queue
      this.queue[existingIndex].socket = socket;
      this.userSocketMap.set(userId, socket);
      return null;
    }

    // Thêm user mới vào queue
    const queuedUser: QueuedUser = {
      userId,
      socket,
      joinedAt: Date.now(),
    };

    this.queue.push(queuedUser);
    this.userSocketMap.set(userId, socket);

    // Kiểm tra có đủ 2 người chơi không
    if (this.queue.length >= 2) {
      const [player1, player2] = this.queue.splice(0, 2);
      
      console.log(`Matchmaking: ${player1.userId} vs ${player2.userId}`);
      console.log(`Current user: ${userId}, returning opponent: ${player1.userId}`);
      
      // KHÔNG xóa khỏi user socket map ngay lập tức
      // Sẽ xóa sau khi tạo phòng thành công

      // Trả về đối thủ (user đầu tiên trong queue)
      return player1.userId;
    }

    return null; // Chưa có đối thủ
  }

  /**
   * Xóa user khỏi hàng đợi
   * @param userId ID của user
   */
  dequeue(userId: string): void {
    const index = this.queue.findIndex(u => u.userId === userId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.userSocketMap.delete(userId);
    }
  }

  /**
   * Lấy socket của user
   * @param userId ID của user
   * @returns Socket hoặc undefined
   */
  getSocket(userId: string): Socket | undefined {
    return this.userSocketMap.get(userId);
  }

  /**
   * Lấy sockets của nhiều user
   * @param userIds Mảng ID của users
   * @returns Mảng sockets
   */
  getSockets(userIds: string[]): Socket[] {
    const sockets = userIds
      .map(id => {
        const socket = this.userSocketMap.get(id);
        console.log(`Getting socket for user ${id}:`, socket ? `Socket ${socket.id} (connected: ${socket.connected})` : 'No socket found');
        return socket;
      })
      .filter(socket => socket !== undefined) as Socket[];
    
    console.log(`getSockets for users [${userIds.join(', ')}]: found ${sockets.length} sockets`);
    return sockets;
  }

  /**
   * Lấy thông tin hàng đợi
   */
  getQueueInfo(): { count: number; users: string[] } {
    return {
      count: this.queue.length,
      users: this.queue.map(u => u.userId),
    };
  }

  /**
   * Xóa user khỏi tất cả (khi disconnect)
   * @param userId ID của user
   */
  removeUser(userId: string): void {
    this.dequeue(userId);
    this.userSocketMap.delete(userId);
  }

  /**
   * Xóa sockets của 2 users sau khi tạo phòng thành công
   * @param userIds Mảng ID của users
   */
  removeMatchedUsers(userIds: string[]): void {
    // KHÔNG xóa sockets khỏi userSocketMap
    // Vì cần giữ để có thể tạo game mới
    // userIds.forEach(userId => {
    //   this.userSocketMap.delete(userId);
    // });
  }

  /**
   * Cập nhật socket cho user (khi reconnect)
   * @param userId ID của user
   * @param socket Socket mới
   */
  updateUserSocket(userId: string, socket: Socket): void {
    this.userSocketMap.set(userId, socket);
  }
}
