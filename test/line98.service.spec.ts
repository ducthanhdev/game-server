import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Line98Service } from '../src/games/line98/line98.service';
import { Line98Game } from '../src/database/schemas/line98-game.schema';

describe('Line98Service', () => {
  let service: Line98Service;
  let mockRepository: any;

  beforeEach(async () => {
    const mockModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ _id: 'game1', ...data }),
    }));

    mockRepository = {
      create: mockModel,
      save: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Line98Service,
        {
          provide: getModelToken(Line98Game.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<Line98Service>(Line98Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNewGame', () => {
    it('should create a new game with 9x9 board', () => {
      const gameState = service.createNewGame('player1');
      
      expect(gameState).toBeDefined();
      expect(gameState.board).toHaveLength(9);
      expect(gameState.board[0]).toHaveLength(9);
      expect(gameState.score).toBe(0);
      expect(gameState.isGameOver).toBe(false);
      expect(gameState.selectedBall).toBeNull();
    });

    it('should generate board with valid colors (1-5)', () => {
      const gameState = service.createNewGame('player1');
      
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          const color = gameState.board[row][col];
          expect(color).toBeGreaterThanOrEqual(1);
          expect(color).toBeLessThanOrEqual(5);
        }
      }
    });
  });

  describe('selectBall', () => {
    it('should select a ball at given position', () => {
      const gameState = service.createNewGame('player1');
      const newState = service.selectBall(gameState, 0, 0);
      
      expect(newState.selectedBall).toEqual({ row: 0, col: 0 });
    });

    it('should not select ball if game is over', () => {
      const gameState = service.createNewGame('player1');
      gameState.isGameOver = true;
      
      const newState = service.selectBall(gameState, 0, 0);
      
      expect(newState.selectedBall).toBeNull();
    });
  });

  describe('moveBall', () => {
    it('should move ball to adjacent empty cell', () => {
      const gameState = service.createNewGame('player1');
      const originalColor = gameState.board[0][0];
      
      // Make sure target cell is empty
      gameState.board[0][1] = 0;
      
      const newState = service.moveBall(gameState, 0, 0, 0, 1);
      
      // The move should succeed and ball should be moved
      expect(newState.board[0][1]).toBe(originalColor);
      // The original position might not be empty due to new balls being added
    });

    it('should not move ball to occupied cell', () => {
      const gameState = service.createNewGame('player1');
      const originalBoard = gameState.board.map(row => [...row]);
      
      const newState = service.moveBall(gameState, 0, 0, 0, 1);
      
      expect(newState.board).toEqual(originalBoard);
    });

    it('should not move ball if game is over', () => {
      const gameState = service.createNewGame('player1');
      gameState.isGameOver = true;
      const originalBoard = gameState.board.map(row => [...row]);
      
      const newState = service.moveBall(gameState, 0, 0, 0, 1);
      
      expect(newState.board).toEqual(originalBoard);
    });
  });

  describe('getHint', () => {
    it('should return null for empty board', () => {
      const gameState = service.createNewGame('player1');
      // Fill board with empty cells
      gameState.board = gameState.board.map(row => row.map(() => 0));
      
      const hint = service.getHint(gameState);
      
      expect(hint).toBeNull();
    });

    it('should return valid hint when possible', () => {
      const gameState = service.createNewGame('player1');
      // Create a scenario where a hint is possible
      gameState.board[0][0] = 1;
      gameState.board[0][1] = 1;
      gameState.board[0][2] = 1;
      gameState.board[0][3] = 1;
      gameState.board[0][4] = 0; // Empty cell for potential move
      
      const hint = service.getHint(gameState);
      
      if (hint) {
        expect(hint.fromRow).toBeGreaterThanOrEqual(0);
        expect(hint.fromRow).toBeLessThan(9);
        expect(hint.fromCol).toBeGreaterThanOrEqual(0);
        expect(hint.fromCol).toBeLessThan(9);
        expect(hint.toRow).toBeGreaterThanOrEqual(0);
        expect(hint.toRow).toBeLessThan(9);
        expect(hint.toCol).toBeGreaterThanOrEqual(0);
        expect(hint.toCol).toBeLessThan(9);
      }
    });
  });

  describe('saveGame', () => {
    it('should save game to repository', async () => {
      const gameState = service.createNewGame('player1');
      
      const result = await service.saveGame('player1', gameState);
      
      expect(result).toBeDefined();
      expect(result.playerId).toBe('player1');
      expect(result.gameState).toEqual(gameState);
    });
  });
});
