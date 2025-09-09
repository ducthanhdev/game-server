import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CaroGame, CaroGameDocument } from '../../database/schemas/caro-game.schema';

export interface CaroGameState {
  id: string;
  board: number[][];
  currentPlayer: number;
  winnerId: string | null;
  isGameOver: boolean;
  player1Id: string;
  player2Id: string;
}

@Injectable()
export class CaroService {
  private readonly BOARD_SIZE = 15;
  private readonly WIN_LENGTH = 5;

  constructor(
    @InjectModel(CaroGame.name)
    private caroModel: Model<CaroGameDocument>,
  ) {}

  createNewGame(player1Id: string): CaroGameState {
    const board = Array(this.BOARD_SIZE).fill(null).map(() => Array(this.BOARD_SIZE).fill(0));
    
    return {
      id: '', // Will be set when saved
      board,
      currentPlayer: 1,
      winnerId: null,
      isGameOver: false,
      player1Id,
      player2Id: '', // Will be set when second player joins
    };
  }

  async createGame(player1Id: string): Promise<CaroGame> {
    const game = new this.caroModel({
      player1Id,
      board: Array(this.BOARD_SIZE).fill(null).map(() => Array(this.BOARD_SIZE).fill(0)),
      currentPlayer: 1,
      isGameOver: false,
    });
    return game.save();
  }

  async joinGame(gameId: string, player2Id: string): Promise<CaroGame | null> {
    const game = await this.caroModel.findById(gameId).exec();
    if (!game || game.player2Id || game.isGameOver) {
      return null;
    }

    game.player2Id = player2Id;
    return game.save();
  }

  async findAvailableGame(): Promise<CaroGame | null> {
    return this.caroModel.findOne({
      player2Id: null,
      isGameOver: false,
    }).sort({ createdAt: 1 }).exec();
  }

  async makeMove(gameId: string, playerId: string, row: number, col: number): Promise<CaroGameState | null> {
    const game = await this.caroModel.findById(gameId).exec();
    if (!game || game.isGameOver) {
      return null;
    }

    // Check if it's the player's turn
    const expectedPlayer = game.currentPlayer === 1 ? game.player1Id : game.player2Id;
    if (expectedPlayer.toString() !== playerId) {
      return null;
    }

    const board = game.board;
    
    // Check if the cell is empty
    if (board[row][col] !== 0) {
      return null;
    }

    // Make the move
    board[row][col] = game.currentPlayer;
    
    // Check for win
    const winner = this.checkWinner(board, row, col);
    let isGameOver = winner !== 0;
    let winnerId = winner === 1 ? game.player1Id : winner === 2 ? game.player2Id : null;

    // Check for draw
    if (!isGameOver && this.isBoardFull(board)) {
      isGameOver = true;
      winnerId = null;
    }

    // Update game
    game.board = board;
    game.currentPlayer = game.currentPlayer === 1 ? 2 : 1;
    game.isGameOver = isGameOver;
    game.winnerId = winnerId;

    await game.save();

    return {
      id: game._id.toString(),
      board,
      currentPlayer: game.currentPlayer,
      winnerId: winnerId ? winnerId.toString() : null,
      isGameOver,
      player1Id: game.player1Id.toString(),
      player2Id: game.player2Id.toString(),
    };
  }

  private checkWinner(board: number[][], row: number, col: number): number {
    const player = board[row][col];
    
    // Check horizontal
    let count = 1;
    for (let i = col - 1; i >= 0 && board[row][i] === player; i--) count++;
    for (let i = col + 1; i < this.BOARD_SIZE && board[row][i] === player; i++) count++;
    if (count >= this.WIN_LENGTH) return player;

    // Check vertical
    count = 1;
    for (let i = row - 1; i >= 0 && board[i][col] === player; i--) count++;
    for (let i = row + 1; i < this.BOARD_SIZE && board[i][col] === player; i++) count++;
    if (count >= this.WIN_LENGTH) return player;

    // Check diagonal (top-left to bottom-right)
    count = 1;
    for (let i = 1; row - i >= 0 && col - i >= 0 && board[row - i][col - i] === player; i++) count++;
    for (let i = 1; row + i < this.BOARD_SIZE && col + i < this.BOARD_SIZE && board[row + i][col + i] === player; i++) count++;
    if (count >= this.WIN_LENGTH) return player;

    // Check diagonal (top-right to bottom-left)
    count = 1;
    for (let i = 1; row - i >= 0 && col + i < this.BOARD_SIZE && board[row - i][col + i] === player; i++) count++;
    for (let i = 1; row + i < this.BOARD_SIZE && col - i >= 0 && board[row + i][col - i] === player; i++) count++;
    if (count >= this.WIN_LENGTH) return player;

    return 0;
  }

  private isBoardFull(board: number[][]): boolean {
    for (let row = 0; row < this.BOARD_SIZE; row++) {
      for (let col = 0; col < this.BOARD_SIZE; col++) {
        if (board[row][col] === 0) {
          return false;
        }
      }
    }
    return true;
  }

  async getGame(gameId: string): Promise<CaroGameState | null> {
    const game = await this.caroModel.findById(gameId).exec();
    if (!game) return null;

    return {
      id: game._id.toString(),
      board: game.board,
      currentPlayer: game.currentPlayer,
      winnerId: game.winnerId ? game.winnerId.toString() : null,
      isGameOver: game.isGameOver,
      player1Id: game.player1Id.toString(),
      player2Id: game.player2Id.toString(),
    };
  }

  async getPlayerGames(playerId: string): Promise<CaroGameState[]> {
    const games = await this.caroModel.find({
      $or: [
        { player1Id: playerId },
        { player2Id: playerId },
      ],
    }).sort({ createdAt: -1 }).exec();

    return games.map(game => ({
      id: game._id.toString(),
      board: game.board,
      currentPlayer: game.currentPlayer,
      winnerId: game.winnerId ? game.winnerId.toString() : null,
      isGameOver: game.isGameOver,
      player1Id: game.player1Id.toString(),
      player2Id: game.player2Id.toString(),
    }));
  }
}