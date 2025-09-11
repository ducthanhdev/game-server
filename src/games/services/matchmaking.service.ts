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
      
      
      // KHÔNG xóa khỏi user socket map ngay lập tức
      // Sẽ xóa sau khi tạo phòng thành công

      // Trả về đối thủ (user đầu tiên trong queue)
      return player1.userId;
    }

    return null; // Chưa có đối thủ
  }

  dequeue(userId: string): void {
    const index = this.queue.findIndex(u => u.userId === userId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.userSocketMap.delete(userId);
    }
  }

  getSocket(userId: string): Socket | undefined {
    return this.userSocketMap.get(userId);
  }

  getSockets(userIds: string[]): Socket[] {
    const sockets = userIds
      .map(id => {
        const socket = this.userSocketMap.get(id);
        return socket;
      })
      .filter(socket => socket !== undefined) as Socket[];
    
    return sockets;
  }

  getQueueInfo(): { count: number; users: string[] } {
    return {
      count: this.queue.length,
      users: this.queue.map(u => u.userId),
    };
  }

  removeUser(userId: string): void {
    this.dequeue(userId);
    this.userSocketMap.delete(userId);
  }


  updateUserSocket(userId: string, socket: Socket): void {
    this.userSocketMap.set(userId, socket);
  }
}
