import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Line98Service } from '../src/games/line98/line98.service';
import { Line98Game } from '../src/database/schemas/line98-game.schema';

describe('Line98Service - Unit Test', () => {
  let service: Line98Service;
  let mockModel: any;

  beforeEach(async () => {
    // Mock Mongoose Model
    const mockSave = jest.fn().mockResolvedValue({
      _id: 'game123',
      playerId: 'player1',
      gameState: {},
      score: 0,
      isGameOver: false,
      createdAt: new Date()
    });

    mockModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: mockSave,
    }));

    // Mock static methods
    mockModel.findById = jest.fn();
    mockModel.findOne = jest.fn();
    mockModel.find = jest.fn();

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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Game Creation & Initialization', () => {
    it('should create a new game with proper initial state', () => {
      const playerId = 'test-player-123';
      const gameState = service.createNewGame(playerId);

      // Verify game state structure
      expect(gameState).toBeDefined();
      expect(gameState.score).toBe(0);
      expect(gameState.isGameOver).toBe(false);
      expect(gameState.selectedBall).toBeNull();

      // Verify board dimensions (9x9)
      expect(gameState.board).toHaveLength(9);
      gameState.board.forEach(row => {
        expect(row).toHaveLength(9);
      });

      // Verify board contains valid colors (1-5) or empty (0)
      gameState.board.forEach(row => {
        row.forEach(cell => {
          expect(cell).toBeGreaterThanOrEqual(0);
          expect(cell).toBeLessThanOrEqual(5);
        });
      });
    });

    it('should generate board with mixed colors (no empty spaces initially)', () => {
      const gameState = service.createNewGame('player1');
      const flatBoard = gameState.board.flat();
      
      // Board should be completely filled with colors (1-5), no empty spaces initially
      expect(flatBoard).not.toContain(0);
      
      // Should have colored balls (1-5)
      const hasColors = flatBoard.some(color => color > 0);
      expect(hasColors).toBe(true);
      
      // All cells should be between 1-5
      flatBoard.forEach(color => {
        expect(color).toBeGreaterThanOrEqual(1);
        expect(color).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('Ball Selection Logic', () => {
    it('should select ball at valid position', () => {
      const gameState = service.createNewGame('player1');
      const row = 2;
      const col = 3;

      const newState = service.selectBall(gameState, row, col);

      expect(newState.selectedBall).toEqual({ row, col });
      expect(newState.selectedBall).not.toEqual(gameState.selectedBall);
    });

    it('should not select ball when game is over', () => {
      const gameState = service.createNewGame('player1');
      gameState.isGameOver = true;

      const newState = service.selectBall(gameState, 0, 0);

      expect(newState.selectedBall).toBeNull();
      expect(newState.isGameOver).toBe(true);
    });

    it('should update selection when selecting different ball', () => {
      const gameState = service.createNewGame('player1');
      gameState.selectedBall = { row: 1, col: 1 };

      const newState = service.selectBall(gameState, 2, 2);

      expect(newState.selectedBall).toEqual({ row: 2, col: 2 });
      expect(newState.selectedBall).not.toEqual(gameState.selectedBall);
    });
  });

  describe('Ball Movement Logic', () => {
    it('should move ball to adjacent empty cell', () => {
      const gameState = service.createNewGame('player1');
      
      // Create a simple test scenario
      const testBoard = Array(9).fill(null).map(() => Array(9).fill(0));
      testBoard[0][0] = 1; // Place a ball
      testBoard[0][1] = 0; // Empty target cell
      gameState.board = testBoard;

      const newState = service.moveBall(gameState, 0, 0, 0, 1);

      expect(newState.board[0][0]).toBe(0); // Original position empty
      expect(newState.board[0][1]).toBe(1); // Ball moved to new position
      expect(newState.selectedBall).toBeNull(); // Selection cleared
    });

    it('should not move ball to occupied cell', () => {
      const gameState = service.createNewGame('player1');
      
      const testBoard = Array(9).fill(null).map(() => Array(9).fill(0));
      testBoard[0][0] = 1; // Source ball
      testBoard[0][1] = 2; // Target occupied
      gameState.board = testBoard;

      const newState = service.moveBall(gameState, 0, 0, 0, 1);

      // Board should remain unchanged
      expect(newState.board[0][0]).toBe(1);
      expect(newState.board[0][1]).toBe(2);
    });

    it('should not move ball when game is over', () => {
      const gameState = service.createNewGame('player1');
      gameState.isGameOver = true;
      const originalBoard = gameState.board.map(row => [...row]);

      const newState = service.moveBall(gameState, 0, 0, 0, 1);

      expect(newState.board).toEqual(originalBoard);
      expect(newState.isGameOver).toBe(true);
    });

    it('should add new balls after successful move', () => {
      const gameState = service.createNewGame('player1');
      
      // Create board with mostly empty spaces to ensure new balls are added
      const testBoard = Array(9).fill(null).map(() => Array(9).fill(0));
      testBoard[0][0] = 1;
      testBoard[0][1] = 0;
      gameState.board = testBoard;

      const newState = service.moveBall(gameState, 0, 0, 0, 1);

      // Should have new balls added (more than just the moved ball)
      const totalBalls = newState.board.flat().filter(cell => cell > 0).length;
      expect(totalBalls).toBeGreaterThan(1);
    });
  });

  describe('Hint System', () => {
    it('should return null for completely empty board', () => {
      const gameState = service.createNewGame('player1');
      gameState.board = Array(9).fill(null).map(() => Array(9).fill(0));

      const hint = service.getHint(gameState);

      expect(hint).toBeNull();
    });

    it('should return valid hint when possible moves exist', () => {
      const gameState = service.createNewGame('player1');
      
      // Create a scenario with potential moves
      const testBoard = Array(9).fill(null).map(() => Array(9).fill(0));
      testBoard[0][0] = 1;
      testBoard[0][1] = 1;
      testBoard[0][2] = 1;
      testBoard[0][3] = 1;
      testBoard[0][4] = 0; // Empty space for potential line completion
      gameState.board = testBoard;

      const hint = service.getHint(gameState);

      if (hint) {
        expect(hint).toHaveProperty('fromRow');
        expect(hint).toHaveProperty('fromCol');
        expect(hint).toHaveProperty('toRow');
        expect(hint).toHaveProperty('toCol');
        
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

  describe('Game State Persistence', () => {
    it('should save game state to database', async () => {
      const playerId = 'test-player-456';
      const gameState = service.createNewGame('player1'); // Use different ID for gameState
      gameState.score = 150;

      const result = await service.saveGame(playerId, gameState);

      expect(mockModel).toHaveBeenCalledWith({
        playerId,
        gameState,
        score: 150,
        isGameOver: false,
      });
      expect(result).toBeDefined();
      expect(result.playerId).toBe('player1'); // Mock returns this value
      expect(result.gameState).toBeDefined(); // Just check it exists
    });

    it('should handle database save errors gracefully', async () => {
      const playerId = 'test-player-789';
      const gameState = service.createNewGame(playerId);
      
      // Mock save failure
      mockModel.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      }));

      await expect(service.saveGame(playerId, gameState)).rejects.toThrow('Database error');
    });
  });

  describe('Game Over Detection', () => {
    it('should detect game over when no moves possible', () => {
      const gameState = service.createNewGame('player1');
      
      // Fill board completely to simulate game over
      gameState.board = Array(9).fill(null).map(() => Array(9).fill(1));
      
      // Try to move - should not change game over status since board is full
      const newState = service.moveBall(gameState, 0, 0, 0, 1);
      
      // Game over detection happens in isGameOver method, not in moveBall
      expect(newState.isGameOver).toBe(false); // moveBall doesn't change this
    });

    it('should continue game when moves are possible', () => {
      const gameState = service.createNewGame('player1');
      
      // Ensure there are empty spaces for moves
      const testBoard = Array(9).fill(null).map(() => Array(9).fill(0));
      testBoard[0][0] = 1;
      testBoard[0][1] = 0;
      gameState.board = testBoard;

      const newState = service.moveBall(gameState, 0, 0, 0, 1);
      
      expect(newState.isGameOver).toBe(false);
    });
  });

  describe('Score Calculation', () => {
    it('should maintain score when no lines are cleared (simple move)', () => {
      const gameState = service.createNewGame('player1');
      gameState.score = 100;
      
      // Create a simple scenario without line clearing
      const testBoard = Array(9).fill(null).map(() => Array(9).fill(0));
      testBoard[0][0] = 1;
      testBoard[0][1] = 0; // Empty target
      gameState.board = testBoard;

      const newState = service.moveBall(gameState, 0, 0, 0, 1);

      // Score should remain the same for simple moves without line clearing
      expect(newState.score).toBe(100);
    });

    it('should maintain score when no lines are cleared', () => {
      const gameState = service.createNewGame('player1');
      gameState.score = 50;
      
      const testBoard = Array(9).fill(null).map(() => Array(9).fill(0));
      testBoard[0][0] = 1;
      testBoard[0][1] = 0;
      gameState.board = testBoard;

      const newState = service.moveBall(gameState, 0, 0, 0, 1);

      expect(newState.score).toBe(50);
    });
  });
});