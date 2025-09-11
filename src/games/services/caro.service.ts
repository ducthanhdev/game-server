import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { nanoid } from 'nanoid';
import { CaroMatch, CaroMatchDocument } from '../../database/schemas/caro-match.schema';
import { isWin } from '../utils/win-check';

export interface RoomState {
  roomId: string;
  board: number[][];
  players: { xUserId: string; oUserId: string };
  turn: 1 | 2; // 1 = X, 2 = O
  moves: Array<{ x: number; y: number; by: string; t: number }>;
  startedAt: number;
  status: 'playing' | 'ended';
  winner?: { userId: string; symbol: 'X' | 'O' };
  newGameRequest?: {
    requestedBy: string;
    confirmedBy: string[];
    rejectedBy: string[];
  };
  turnTimeout?: NodeJS.Timeout;
  lastMoveTime?: number;
}

export class WsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WsError';
  }
}

@Injectable()
export class CaroService {
  private rooms = new Map<string, RoomState>();

  constructor(
    @InjectModel(CaroMatch.name)
    private caroMatchModel: Model<CaroMatchDocument>,
  ) {}

  /**
   * Tạo phòng game mới
   * @param xUserId ID của người chơi X
   * @param oUserId ID của người chơi O
   * @returns Trạng thái phòng
   */
  createRoom(xUserId: string, oUserId: string): RoomState {
    const roomId = nanoid();
    const board = Array.from({ length: 15 }, () => Array(15).fill(0));
    
    const state: RoomState = {
      roomId,
      board,
      players: { xUserId, oUserId },
      turn: 1, // X đi trước
      moves: [],
      startedAt: Date.now(),
      status: 'playing',
    };

    this.rooms.set(roomId, state);
    return state;
  }

  /**
   * Thực hiện nước đi
   * @param roomId ID phòng
   * @param userId ID người chơi
   * @param x Tọa độ x
   * @param y Tọa độ y
   * @returns Kết quả nước đi
   */
  makeMove(roomId: string, userId: string, x: number, y: number): {
    state: RoomState;
    win: boolean;
    winnerSymbol?: 'X' | 'O';
    winLine?: { from: { x: number; y: number }; to: { x: number; y: number } };
  } {
    const state = this.rooms.get(roomId);
    if (!state || state.status !== 'playing') {
      throw new WsError('ROOM_NOT_FOUND');
    }

    // Xác định symbol của người chơi
    const symbol = state.players.xUserId === userId ? 1 : 
                   state.players.oUserId === userId ? 2 : 0;
    
    if (!symbol) {
      throw new WsError('NOT_IN_ROOM');
    }

    if (state.turn !== symbol) {
      throw new WsError('NOT_YOUR_TURN');
    }

    if (x < 0 || y < 0 || x >= 15 || y >= 15) {
      throw new WsError('OUT_OF_RANGE');
    }

    if (state.board[y][x] !== 0) {
      throw new WsError('CELL_TAKEN');
    }

    // Dừng timeout cũ
    this.stopTurnTimeout(roomId);

    // Thực hiện nước đi
    state.board[y][x] = symbol;
    state.moves.push({ x, y, by: userId, t: Date.now() });
    state.turn = symbol === 1 ? 2 : 1;

    // Kiểm tra thắng
    const win = isWin(state.board, x, y);
    const winnerSymbol = win ? (symbol === 1 ? 'X' : 'O') : undefined;

    return {
      state,
      win,
      winnerSymbol,
    };
  }

  /**
   * Kết thúc game và lưu vào database
   * @param roomId ID phòng
   * @param winnerUserId ID người thắng
   * @param winnerSymbol Ký hiệu người thắng
   */
  async endAndPersist(roomId: string, winnerUserId?: string, winnerSymbol?: 'X' | 'O'): Promise<void> {
    const state = this.rooms.get(roomId);
    if (!state) return;

    state.status = 'ended';
    state.winner = winnerUserId ? { userId: winnerUserId, symbol: winnerSymbol! } : undefined;

    // Lưu vào database
    try {
      await this.caroMatchModel.create({
        roomId: state.roomId,
        xUserId: state.players.xUserId,
        oUserId: state.players.oUserId,
        size: 15,
        moves: state.moves,
        winnerUserId,
        winnerSymbol,
        status: 'ended',
        endedAt: new Date(),
      });
    } catch (error) {
      console.error('Error saving caro match:', error);
    }

    // KHÔNG xóa khỏi memory ngay lập tức
    // Sẽ xóa sau một thời gian hoặc khi tạo game mới
    // this.rooms.delete(roomId);
  }

  /**
   * Lấy trạng thái phòng
   * @param roomId ID phòng
   * @returns Trạng thái phòng hoặc undefined
   */
  getState(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Yêu cầu game mới
   * @param roomId ID phòng
   * @param userId ID người yêu cầu
   * @returns Trạng thái yêu cầu
   */
  requestNewGame(roomId: string, userId: string): { success: boolean; message: string } {
    const state = this.rooms.get(roomId);
    if (!state) {
      return { success: false, message: 'Phòng không tồn tại' };
    }

    if (state.players.xUserId !== userId && state.players.oUserId !== userId) {
      return { success: false, message: 'Bạn không có trong phòng này' };
    }

    if (state.status !== 'ended') {
      return { success: false, message: 'Game chưa kết thúc' };
    }

    // Nếu đã có yêu cầu từ người khác
    if (state.newGameRequest && state.newGameRequest.requestedBy !== userId) {
      return { success: false, message: 'Đã có yêu cầu game mới từ người chơi khác' };
    }

    // Tạo yêu cầu mới
    state.newGameRequest = {
      requestedBy: userId,
      confirmedBy: [userId],
      rejectedBy: []
    };

    return { success: true, message: 'Đã gửi yêu cầu game mới' };
  }

  /**
   * Xác nhận game mới
   * @param roomId ID phòng
   * @param userId ID người xác nhận
   * @returns Trạng thái xác nhận
   */
  confirmNewGame(roomId: string, userId: string): { success: boolean; message: string; shouldCreate: boolean } {
    const state = this.rooms.get(roomId);
    if (!state || !state.newGameRequest) {
      return { success: false, message: 'Không có yêu cầu game mới', shouldCreate: false };
    }

    if (state.players.xUserId !== userId && state.players.oUserId !== userId) {
      return { success: false, message: 'Bạn không có trong phòng này', shouldCreate: false };
    }

    if (state.newGameRequest.rejectedBy.includes(userId)) {
      return { success: false, message: 'Bạn đã từ chối game mới', shouldCreate: false };
    }

    if (state.newGameRequest.confirmedBy.includes(userId)) {
      return { success: false, message: 'Bạn đã xác nhận rồi', shouldCreate: false };
    }

    // Thêm vào danh sách xác nhận
    state.newGameRequest.confirmedBy.push(userId);

    // Kiểm tra xem cả 2 người đã xác nhận chưa
    const allPlayers = [state.players.xUserId, state.players.oUserId];
    const allConfirmed = allPlayers.every(playerId => 
      state.newGameRequest!.confirmedBy.includes(playerId)
    );

    if (allConfirmed) {
      return { success: true, message: 'Cả 2 người đã xác nhận', shouldCreate: true };
    }

    return { success: true, message: 'Đã xác nhận, chờ người chơi còn lại', shouldCreate: false };
  }

  /**
   * Từ chối game mới
   * @param roomId ID phòng
   * @param userId ID người từ chối
   * @returns Trạng thái từ chối
   */
  rejectNewGame(roomId: string, userId: string): { success: boolean; message: string } {
    const state = this.rooms.get(roomId);
    if (!state || !state.newGameRequest) {
      return { success: false, message: 'Không có yêu cầu game mới' };
    }

    if (state.players.xUserId !== userId && state.players.oUserId !== userId) {
      return { success: false, message: 'Bạn không có trong phòng này' };
    }

    if (state.newGameRequest.confirmedBy.includes(userId)) {
      return { success: false, message: 'Bạn đã xác nhận rồi' };
    }

    // Thêm vào danh sách từ chối
    state.newGameRequest.rejectedBy.push(userId);

    return { success: true, message: 'Đã từ chối game mới' };
  }

  /**
   * Xóa yêu cầu game mới
   * @param roomId ID phòng
   */
  clearNewGameRequest(roomId: string): void {
    const state = this.rooms.get(roomId);
    if (state) {
      state.newGameRequest = undefined;
    }
  }

  /**
   * Bắt đầu timeout cho lượt đi
   * @param roomId ID phòng
   * @param timeoutCallback Callback khi timeout
   */
  startTurnTimeout(roomId: string, timeoutCallback: () => void): void {
    const state = this.rooms.get(roomId);
    if (!state || state.status !== 'playing') return;

    if (state.turnTimeout) {
      clearTimeout(state.turnTimeout);
    }

    state.turnTimeout = setTimeout(() => {
      timeoutCallback();
    }, 30000);

    state.lastMoveTime = Date.now();
  }

  /**
   * Dừng timeout cho lượt đi
   * @param roomId ID phòng
   */
  stopTurnTimeout(roomId: string): void {
    const state = this.rooms.get(roomId);
    if (!state || !state.turnTimeout) return;

    clearTimeout(state.turnTimeout);
    state.turnTimeout = undefined;
  }

  /**
   * Lấy thời gian còn lại của lượt đi
   * @param roomId ID phòng
   * @returns Thời gian còn lại (ms) hoặc 0 nếu không có timeout
   */
  getRemainingTime(roomId: string): number {
    const state = this.rooms.get(roomId);
    if (!state || !state.lastMoveTime || !state.turnTimeout) return 0;

    const elapsed = Date.now() - state.lastMoveTime;
    const remaining = 30000 - elapsed; // 30 seconds
    return Math.max(0, remaining);
  }

  /**
   * Lấy thông tin phòng (không bao gồm board đầy đủ)
   * @param roomId ID phòng
   * @returns Thông tin phòng
   */
  getRoomInfo(roomId: string): Partial<RoomState> | undefined {
    const state = this.rooms.get(roomId);
    if (!state) return undefined;

    return {
      roomId: state.roomId,
      players: state.players,
      turn: state.turn,
      moves: state.moves,
      startedAt: state.startedAt,
      status: state.status,
      winner: state.winner,
    };
  }

  /**
   * Xóa phòng (khi có lỗi hoặc disconnect)
   * @param roomId ID phòng
   */
  removeRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }

  /**
   * Kết thúc game và lưu kết quả
   * @param roomId ID phòng
   * @param winnerId ID người thắng
   * @param winnerSymbol Symbol người thắng
   */
  async endGame(roomId: string, winnerId: string, winnerSymbol: 'X' | 'O'): Promise<void> {
    const state = this.rooms.get(roomId);
    if (!state) return;

    this.stopTurnTimeout(roomId);
    state.status = 'ended';
    state.winner = { userId: winnerId, symbol: winnerSymbol };

    try {
      const match = new this.caroMatchModel({
        roomId: state.roomId,
        players: state.players,
        moves: state.moves,
        winner: state.winner,
        startedAt: new Date(state.startedAt),
        endedAt: new Date(),
        status: 'completed'
      });

      await match.save();
    } catch (error) {
      console.error('Error saving game to database:', error);
    }

    this.rooms.delete(roomId);
  }
}
