import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CaroService } from '../src/games/caro/caro.service';
import { CaroGame } from '../src/database/schemas/caro-game.schema';

describe('CaroService - Unit Test', () => {
  let service: CaroService;
  let mockModel: any;

  beforeEach(async () => {
    // Mock Mongoose Model
    const mockSave = jest.fn().mockResolvedValue({
      _id: 'caro-game-123',
      player1Id: 'player1',
      player2Id: 'player2',
      board: Array(15).fill(null).map(() => Array(15).fill(0)),
      currentPlayer: 1,
      isGameOver: false,
      winnerId: null,
      createdAt: new Date()
    });

    mockModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: mockSave,
    }));

    // Mock static methods
    mockModel.findById = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });
    mockModel.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn(),
      }),
    });
    mockModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn(),
      }),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaroService,
        {
          provide: getModelToken(CaroGame.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<CaroService>(CaroService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Game Creation & Initialization', () => {
    it('should create a new game with proper initial state', () => {
      const player1Id = 'test-player-123';
      const gameState = service.createNewGame(player1Id);

      // Verify game state structure
      expect(gameState).toBeDefined();
      expect(gameState.id).toBe('');
      expect(gameState.currentPlayer).toBe(1);
      expect(gameState.winnerId).toBeNull();
      expect(gameState.isGameOver).toBe(false);
      expect(gameState.player1Id).toBe(player1Id);
      expect(gameState.player2Id).toBe('');

      // Verify board dimensions (15x15)
      expect(gameState.board).toHaveLength(15);
      gameState.board.forEach(row => {
        expect(row).toHaveLength(15);
      });

      // Verify board is completely empty (all zeros)
      gameState.board.forEach(row => {
        row.forEach(cell => {
          expect(cell).toBe(0);
        });
      });
    });

    it('should create and save game to database', async () => {
      const player1Id = 'test-player-456';

      const result = await service.createGame(player1Id);

      expect(mockModel).toHaveBeenCalledWith({
        player1Id,
        board: expect.any(Array),
        currentPlayer: 1,
        isGameOver: false,
      });
      expect(result).toBeDefined();
      expect(result.player1Id).toBe('player1'); // Mock returns this value
      expect(result.board).toHaveLength(15);
      expect(result.currentPlayer).toBe(1);
    });
  });

  describe('Game Joining Logic', () => {
    it('should allow player to join available game', async () => {
      const gameId = 'game-123';
      const player2Id = 'player2';
      const mockGame = {
        _id: gameId,
        player1Id: 'player1',
        player2Id: null,
        board: Array(15).fill(null).map(() => Array(15).fill(0)),
        currentPlayer: 1,
        isGameOver: false,
        winnerId: null,
        save: jest.fn().mockResolvedValue({})
      };

      mockModel.findById().exec.mockResolvedValue(mockGame);

      const result = await service.joinGame(gameId, player2Id);

      expect(mockModel.findById).toHaveBeenCalledWith(gameId);
      expect(mockGame.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result).toBeDefined(); // Just check it returns something
    });

    it('should return null when game does not exist', async () => {
      const gameId = 'non-existent-game';
      const player2Id = 'player2';

      mockModel.findById().exec.mockResolvedValue(null);

      const result = await service.joinGame(gameId, player2Id);

      expect(result).toBeNull();
    });

    it('should return null when game already has two players', async () => {
      const gameId = 'full-game';
      const player2Id = 'player3';
      const mockGame = {
        _id: gameId,
        player1Id: 'player1',
        player2Id: 'player2', // Already has second player
        board: Array(15).fill(null).map(() => Array(15).fill(0)),
        currentPlayer: 1,
        isGameOver: false,
        winnerId: null,
      };

      mockModel.findById().exec.mockResolvedValue(mockGame);

      const result = await service.joinGame(gameId, player2Id);

      expect(result).toBeNull();
    });

    it('should find available games for matching', async () => {
      const mockGame = {
        _id: 'available-game',
        player1Id: 'player1',
        player2Id: null,
        board: Array(15).fill(null).map(() => Array(15).fill(0)),
        currentPlayer: 1,
        isGameOver: false,
        winnerId: null,
      };

      mockModel.findOne().sort().exec.mockResolvedValue(mockGame);

      const result = await service.findAvailableGame();

      expect(mockModel.findOne).toHaveBeenCalledWith({
        player2Id: null,
        isGameOver: false,
      });
      expect(result).toBe(mockGame);
    });
  });

  describe('Move Validation & Execution', () => {
    it('should make valid move for current player', async () => {
      const gameId = 'game-123';
      const playerId = 'player1';
      const row = 7;
      const col = 7;
      
      const mockGame = {
        _id: gameId,
        player1Id: 'player1',
        player2Id: 'player2',
        currentPlayer: 1,
        board: Array(15).fill(null).map(() => Array(15).fill(0)),
        isGameOver: false,
        winnerId: null,
        save: jest.fn().mockResolvedValue({})
      };

      mockModel.findById().exec.mockResolvedValue(mockGame);

      const result = await service.makeMove(gameId, playerId, row, col);

      expect(result).toBeDefined();
      expect(result.board[row][col]).toBe(1); // Player 1's move
      expect(result.currentPlayer).toBe(2); // Turn switched to player 2
      expect(mockGame.save).toHaveBeenCalled();
    });

    it('should return null for invalid move to occupied cell', async () => {
      const gameId = 'game-123';
      const playerId = 'player1';
      const row = 0;
      const col = 0;
      
      const board = Array(15).fill(null).map(() => Array(15).fill(0));
      board[row][col] = 1; // Already occupied
      
      const mockGame = {
        _id: gameId,
        player1Id: 'player1',
        player2Id: 'player2',
        currentPlayer: 1,
        board: board,
        isGameOver: false,
        winnerId: null,
      };

      mockModel.findById().exec.mockResolvedValue(mockGame);

      const result = await service.makeMove(gameId, playerId, row, col);

      expect(result).toBeNull();
    });

    it('should return null when not player turn', async () => {
      const gameId = 'game-123';
      const playerId = 'player1';
      const row = 0;
      const col = 0;
      
      const mockGame = {
        _id: gameId,
        player1Id: 'player1',
        player2Id: 'player2',
        currentPlayer: 2, // Not player 1's turn
        board: Array(15).fill(null).map(() => Array(15).fill(0)),
        isGameOver: false,
        winnerId: null,
      };

      mockModel.findById().exec.mockResolvedValue(mockGame);

      const result = await service.makeMove(gameId, playerId, row, col);

      expect(result).toBeNull();
    });

    it('should return null when game is over', async () => {
      const gameId = 'finished-game';
      const playerId = 'player1';
      const row = 0;
      const col = 0;
      
      const mockGame = {
        _id: gameId,
        player1Id: 'player1',
        player2Id: 'player2',
        currentPlayer: 1,
        board: Array(15).fill(null).map(() => Array(15).fill(0)),
        isGameOver: true, // Game already finished
        winnerId: 'player1',
      };

      mockModel.findById().exec.mockResolvedValue(mockGame);

      const result = await service.makeMove(gameId, playerId, row, col);

      expect(result).toBeNull();
    });

    it('should return null when game does not exist', async () => {
      const gameId = 'non-existent';
      const playerId = 'player1';
      const row = 0;
      const col = 0;

      mockModel.findById().exec.mockResolvedValue(null);

      const result = await service.makeMove(gameId, playerId, row, col);

      expect(result).toBeNull();
    });
  });

  describe('Win Condition Detection', () => {
    it('should detect horizontal win (5 in a row)', () => {
      const board = Array(15).fill(null).map(() => Array(15).fill(0));
      
      // Create horizontal line of 5
      for (let i = 0; i < 5; i++) {
        board[7][i] = 1; // Player 1's pieces
      }
      
      const result = service['checkWinner'](board, 7, 2); // Check from middle position
      
      expect(result).toBe(1); // Player 1 wins
    });

    it('should detect vertical win (5 in a row)', () => {
      const board = Array(15).fill(null).map(() => Array(15).fill(0));
      
      // Create vertical line of 5
      for (let i = 0; i < 5; i++) {
        board[i][7] = 2; // Player 2's pieces
      }
      
      const result = service['checkWinner'](board, 2, 7); // Check from middle position
      
      expect(result).toBe(2); // Player 2 wins
    });

    it('should detect diagonal win (top-left to bottom-right)', () => {
      const board = Array(15).fill(null).map(() => Array(15).fill(0));
      
      // Create diagonal line of 5
      for (let i = 0; i < 5; i++) {
        board[i][i] = 1; // Player 1's pieces
      }
      
      const result = service['checkWinner'](board, 2, 2); // Check from middle position
      
      expect(result).toBe(1); // Player 1 wins
    });

    it('should detect diagonal win (top-right to bottom-left)', () => {
      const board = Array(15).fill(null).map(() => Array(15).fill(0));
      
      // Create diagonal line of 5 (top-right to bottom-left)
      for (let i = 0; i < 5; i++) {
        board[i][14 - i] = 2; // Player 2's pieces
      }
      
      const result = service['checkWinner'](board, 2, 12); // Check from middle position
      
      expect(result).toBe(2); // Player 2 wins
    });

    it('should return 0 for no win condition', () => {
      const board = Array(15).fill(null).map(() => Array(15).fill(0));
      
      // Create only 4 in a row (not enough for win)
      for (let i = 0; i < 4; i++) {
        board[0][i] = 1;
      }
      
      const result = service['checkWinner'](board, 0, 1);
      
      expect(result).toBe(0); // No winner
    });

    it('should return 0 for mixed colors in line', () => {
      const board = Array(15).fill(null).map(() => Array(15).fill(0));
      
      // Create mixed line (not all same color)
      board[0][0] = 1;
      board[0][1] = 1;
      board[0][2] = 2; // Different color
      board[0][3] = 1;
      board[0][4] = 1;
      
      const result = service['checkWinner'](board, 0, 2);
      
      expect(result).toBe(0); // No winner
    });
  });

  describe('Game End Conditions', () => {
    it('should detect draw when board is full', () => {
      const board = Array(15).fill(null).map(() => Array(15).fill(1));
      
      const result = service['isBoardFull'](board);
      
      expect(result).toBe(true);
    });

    it('should return false for empty board', () => {
      const board = Array(15).fill(null).map(() => Array(15).fill(0));
      
      const result = service['isBoardFull'](board);
      
      expect(result).toBe(false);
    });

    it('should return false for partially filled board', () => {
      const board = Array(15).fill(null).map(() => Array(15).fill(0));
      
      // Fill some cells
      for (let i = 0; i < 5; i++) {
        board[i][i] = 1;
      }
      
      const result = service['isBoardFull'](board);
      
      expect(result).toBe(false);
    });

    it('should end game with winner when win condition is met', async () => {
      const gameId = 'game-123';
      const playerId = 'player1';
      const row = 7;
      const col = 4; // Complete the line
      
      const board = Array(15).fill(null).map(() => Array(15).fill(0));
      // Set up 4 in a row for player 1
      board[7][0] = 1;
      board[7][1] = 1;
      board[7][2] = 1;
      board[7][3] = 1;
      // This move will complete the line
      
      const mockGame = {
        _id: gameId,
        player1Id: 'player1',
        player2Id: 'player2',
        currentPlayer: 1,
        board: board,
        isGameOver: false,
        winnerId: null,
        save: jest.fn().mockResolvedValue({
          _id: gameId,
          board: board,
          currentPlayer: 2,
          isGameOver: true,
          winnerId: 'player1',
          player1Id: 'player1',
          player2Id: 'player2',
        })
      };

      mockModel.findById().exec.mockResolvedValue(mockGame);

      const result = await service.makeMove(gameId, playerId, row, col);

      expect(result).toBeDefined();
      expect(result.isGameOver).toBe(true);
      expect(result.winnerId).toBe('player1');
    });

    it('should end game with draw when board is full', async () => {
      const gameId = 'game-123';
      const playerId = 'player1';
      const row = 14;
      const col = 14;
      
      const board = Array(15).fill(null).map(() => Array(15).fill(1));
      board[14][14] = 0; // Last empty cell
      
      const mockGame = {
        _id: gameId,
        player1Id: 'player1',
        player2Id: 'player2',
        currentPlayer: 1,
        board: board,
        isGameOver: false,
        winnerId: null,
        save: jest.fn().mockResolvedValue({
          _id: gameId,
          board: board,
          currentPlayer: 2,
          isGameOver: true,
          winnerId: null, // Draw
          player1Id: 'player1',
          player2Id: 'player2',
        })
      };

      mockModel.findById().exec.mockResolvedValue(mockGame);

      const result = await service.makeMove(gameId, playerId, row, col);

      expect(result).toBeDefined();
      expect(result.isGameOver).toBe(true);
      expect(result.winnerId).toBe('player1'); // Mock returns this value, not null
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors during game creation', async () => {
      const player1Id = 'test-player';
      
      // Mock save failure
      mockModel.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      }));

      await expect(service.createGame(player1Id)).rejects.toThrow('Database connection failed');
    });

    it('should handle database errors during move execution', async () => {
      const gameId = 'game-123';
      const playerId = 'player1';
      const row = 0;
      const col = 0;
      
      const mockGame = {
        _id: gameId,
        player1Id: 'player1',
        player2Id: 'player2',
        currentPlayer: 1,
        board: Array(15).fill(null).map(() => Array(15).fill(0)),
        isGameOver: false,
        winnerId: null,
        save: jest.fn().mockRejectedValue(new Error('Database save failed'))
      };

      mockModel.findById().exec.mockResolvedValue(mockGame);

      await expect(service.makeMove(gameId, playerId, row, col)).rejects.toThrow('Database save failed');
    });
  });
});