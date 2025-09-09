import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Line98Game, Line98GameDocument } from '../../database/schemas/line98-game.schema';

export interface GameState {
  board: number[][];
  score: number;
  isGameOver: boolean;
  selectedBall: { row: number; col: number } | null;
}

@Injectable()
export class Line98Service {
  private readonly BOARD_SIZE = 9;
  private readonly COLORS = 5;
  private readonly LINE_LENGTH = 5;

  constructor(
    @InjectModel(Line98Game.name)
    private line98Model: Model<Line98GameDocument>,
  ) {}

  createNewGame(playerId: string): GameState {
    const board = this.generateInitialBoard();
    return {
      board,
      score: 0,
      isGameOver: false,
      selectedBall: null,
    };
  }

  private generateInitialBoard(): number[][] {
    const board: number[][] = [];
    for (let i = 0; i < this.BOARD_SIZE; i++) {
      board[i] = [];
      for (let j = 0; j < this.BOARD_SIZE; j++) {
        board[i][j] = Math.floor(Math.random() * this.COLORS) + 1;
      }
    }
    return board;
  }

  selectBall(gameState: GameState, row: number, col: number): GameState {
    if (gameState.isGameOver) return gameState;

    const newState = { ...gameState };
    newState.selectedBall = { row, col };
    return newState;
  }

  moveBall(gameState: GameState, fromRow: number, fromCol: number, toRow: number, toCol: number): GameState {
    if (gameState.isGameOver) return gameState;

    const newState = { ...gameState };
    const board = newState.board.map(row => [...row]);

    // Check if move is valid
    if (!this.isValidMove(board, fromRow, fromCol, toRow, toCol)) {
      return gameState;
    }

    // Move the ball
    const ballColor = board[fromRow][fromCol];
    board[fromRow][fromCol] = 0;
    board[toRow][toCol] = ballColor;

    // Check for lines to remove
    const linesToRemove = this.findLines(board);
    let score = newState.score;

    linesToRemove.forEach(({ row, col, direction, length }) => {
      for (let i = 0; i < length; i++) {
        if (direction === 'horizontal') {
          board[row][col + i] = 0;
        } else if (direction === 'vertical') {
          board[row + i][col] = 0;
        } else if (direction === 'diagonal') {
          board[row + i][col + i] = 0;
        }
      }
      score += length * 10;
    });

    // Add new balls
    this.addNewBalls(board);

    // Check if game is over
    const isGameOver = this.isGameOver(board);

    newState.board = board;
    newState.score = score;
    newState.isGameOver = isGameOver;
    newState.selectedBall = null;

    return newState;
  }

  private isValidMove(board: number[][], fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    // Check if positions are within bounds
    if (toRow < 0 || toRow >= this.BOARD_SIZE || toCol < 0 || toCol >= this.BOARD_SIZE) {
      return false;
    }

    // Check if destination is empty
    if (board[toRow][toCol] !== 0) {
      return false;
    }

    // Check if there's a path (simplified - just check if adjacent)
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }

  private findLines(board: number[][]): Array<{ row: number; col: number; direction: string; length: number }> {
    const lines: Array<{ row: number; col: number; direction: string; length: number }> = [];

    // Check horizontal lines
    for (let row = 0; row < this.BOARD_SIZE; row++) {
      for (let col = 0; col <= this.BOARD_SIZE - this.LINE_LENGTH; col++) {
        const color = board[row][col];
        if (color === 0) continue;

        let length = 1;
        while (col + length < this.BOARD_SIZE && board[row][col + length] === color) {
          length++;
        }

        if (length >= this.LINE_LENGTH) {
          lines.push({ row, col, direction: 'horizontal', length });
        }
      }
    }

    // Check vertical lines
    for (let row = 0; row <= this.BOARD_SIZE - this.LINE_LENGTH; row++) {
      for (let col = 0; col < this.BOARD_SIZE; col++) {
        const color = board[row][col];
        if (color === 0) continue;

        let length = 1;
        while (row + length < this.BOARD_SIZE && board[row + length][col] === color) {
          length++;
        }

        if (length >= this.LINE_LENGTH) {
          lines.push({ row, col, direction: 'vertical', length });
        }
      }
    }

    // Check diagonal lines
    for (let row = 0; row <= this.BOARD_SIZE - this.LINE_LENGTH; row++) {
      for (let col = 0; col <= this.BOARD_SIZE - this.LINE_LENGTH; col++) {
        const color = board[row][col];
        if (color === 0) continue;

        let length = 1;
        while (row + length < this.BOARD_SIZE && col + length < this.BOARD_SIZE && 
               board[row + length][col + length] === color) {
          length++;
        }

        if (length >= this.LINE_LENGTH) {
          lines.push({ row, col, direction: 'diagonal', length });
        }
      }
    }

    return lines;
  }

  private addNewBalls(board: number[][]): void {
    const emptyCells: { row: number; col: number }[] = [];
    
    for (let row = 0; row < this.BOARD_SIZE; row++) {
      for (let col = 0; col < this.BOARD_SIZE; col++) {
        if (board[row][col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }

    // Add 3 new balls
    for (let i = 0; i < Math.min(3, emptyCells.length); i++) {
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      const cell = emptyCells.splice(randomIndex, 1)[0];
      board[cell.row][cell.col] = Math.floor(Math.random() * this.COLORS) + 1;
    }
  }

  private isGameOver(board: number[][]): boolean {
    // Check if there are any possible moves
    for (let row = 0; row < this.BOARD_SIZE; row++) {
      for (let col = 0; col < this.BOARD_SIZE; col++) {
        if (board[row][col] === 0) continue;

        // Check adjacent empty cells
        const directions = [
          [-1, 0], [1, 0], [0, -1], [0, 1]
        ];

        for (const [dr, dc] of directions) {
          const newRow = row + dr;
          const newCol = col + dc;
          if (newRow >= 0 && newRow < this.BOARD_SIZE && 
              newCol >= 0 && newCol < this.BOARD_SIZE && 
              board[newRow][newCol] === 0) {
            return false;
          }
        }
      }
    }
    return true;
  }

  getHint(gameState: GameState): { fromRow: number; fromCol: number; toRow: number; toCol: number } | null {
    const board = gameState.board;
    
    for (let row = 0; row < this.BOARD_SIZE; row++) {
      for (let col = 0; col < this.BOARD_SIZE; col++) {
        if (board[row][col] === 0) continue;

        const directions = [
          [-1, 0], [1, 0], [0, -1], [0, 1]
        ];

        for (const [dr, dc] of directions) {
          const newRow = row + dr;
          const newCol = col + dc;
          if (newRow >= 0 && newRow < this.BOARD_SIZE && 
              newCol >= 0 && newCol < this.BOARD_SIZE && 
              board[newRow][newCol] === 0) {
            
            // Simulate the move to see if it creates a line
            const tempBoard = board.map(r => [...r]);
            const ballColor = tempBoard[row][col];
            tempBoard[row][col] = 0;
            tempBoard[newRow][newCol] = ballColor;

            const lines = this.findLines(tempBoard);
            if (lines.length > 0) {
              return { fromRow: row, fromCol: col, toRow: newRow, toCol: newCol };
            }
          }
        }
      }
    }
    return null;
  }

  async saveGame(playerId: string, gameState: GameState): Promise<Line98Game> {
    const game = new this.line98Model({
      playerId,
      gameState,
      score: gameState.score,
      isGameOver: gameState.isGameOver,
    });
    return game.save();
  }

  async loadGame(gameId: string): Promise<GameState | null> {
    const game = await this.line98Model.findById(gameId).exec();
    if (!game) return null;
    return game.gameState;
  }
}
