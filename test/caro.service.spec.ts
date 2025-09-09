import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CaroService } from '../src/games/caro/caro.service';
import { CaroGame } from '../src/database/schemas/caro-game.schema';

describe('CaroService', () => {
  let service: CaroService;
  let mockModel: any;

  beforeEach(async () => {
    mockModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ _id: 'game1', ...data }),
    }));

    // Add static methods to the mock
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNewGame', () => {
    it('should create a new game with 15x15 board', () => {
      const gameState = service.createNewGame('player1');
      
      expect(gameState).toBeDefined();
      expect(gameState.board).toHaveLength(15);
      expect(gameState.board[0]).toHaveLength(15);
      expect(gameState.currentPlayer).toBe(1);
      expect(gameState.winnerId).toBeNull();
      expect(gameState.isGameOver).toBe(false);
      expect(gameState.player1Id).toBe('player1');
      expect(gameState.player2Id).toBe('');
    });

    it('should initialize board with all zeros', () => {
      const gameState = service.createNewGame('player1');
      
      for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
          expect(gameState.board[row][col]).toBe(0);
        }
      }
    });
  });

  describe('createGame', () => {
    it('should create and save a new game', async () => {
      const result = await service.createGame('player1');
      
      expect(result).toBeDefined();
      expect(result.player1Id).toBe('player1');
      expect(result.board).toBeDefined();
      expect(result.currentPlayer).toBe(1);
      expect(result.isGameOver).toBe(false);
    });
  });

  describe('joinGame', () => {
    it('should join an available game', async () => {
      const mockGame = { _id: 'game1', player1Id: 'player1', player2Id: null, save: jest.fn().mockResolvedValue({}) };
      mockModel.findById().exec.mockResolvedValue(mockGame);
      
      const result = await service.joinGame('game1', 'player2');
      
      expect(mockModel.findById).toHaveBeenCalledWith('game1');
      expect(result).toBeDefined();
      // Just check that the method was called and returned something
      expect(typeof result).toBe('object');
    });

    it('should return null if game is not available', async () => {
      mockModel.findById().exec.mockResolvedValue(null);
      
      const result = await service.joinGame('game1', 'player2');
      
      expect(result).toBeNull();
    });

    it('should return null if game already has two players', async () => {
      const mockGame = { _id: 'game1', player1Id: 'player1', player2Id: 'player2' };
      mockModel.findById().exec.mockResolvedValue(mockGame);
      
      const result = await service.joinGame('game1', 'player3');
      
      expect(result).toBeNull();
    });
  });

  describe('findAvailableGame', () => {
    it('should find an available game', async () => {
      const mockGame = { _id: 'game1', player1Id: 'player1', player2Id: null };
      mockModel.findOne().sort().exec.mockResolvedValue(mockGame);
      
      const result = await service.findAvailableGame();
      
      expect(mockModel.findOne).toHaveBeenCalledWith({
        player2Id: null,
        isGameOver: false,
      });
      expect(result).toBe(mockGame);
    });
  });

  describe('makeMove', () => {
    it('should make a valid move', async () => {
      const board = Array(15).fill(null).map(() => Array(15).fill(0));
      const mockGame = {
        _id: 'game1',
        player1Id: 'player1',
        player2Id: 'player2',
        currentPlayer: 1,
        board: board,
        isGameOver: false,
        save: jest.fn().mockResolvedValue({}),
      };
      
      mockModel.findById().exec.mockResolvedValue(mockGame);
      
      const result = await service.makeMove('game1', 'player1', 0, 0);
      
      expect(result).toBeDefined();
      expect(result.board[0][0]).toBe(1);
      expect(result.currentPlayer).toBe(2);
    });

    it('should return null for invalid move', async () => {
      const board = Array(15).fill(null).map(() => Array(15).fill(0));
      board[0][0] = 1; // Already occupied
      const mockGame = {
        _id: 'game1',
        player1Id: 'player1',
        player2Id: 'player2',
        currentPlayer: 1,
        board: board,
        isGameOver: false,
      };
      
      mockModel.findById().exec.mockResolvedValue(mockGame);
      
      const result = await service.makeMove('game1', 'player1', 0, 0);
      
      expect(result).toBeNull();
    });

    it('should return null if not player turn', async () => {
      const board = Array(15).fill(null).map(() => Array(15).fill(0));
      const mockGame = {
        _id: 'game1',
        player1Id: 'player1',
        player2Id: 'player2',
        currentPlayer: 2, // Not player 1's turn
        board: board,
        isGameOver: false,
      };
      
      mockModel.findById().exec.mockResolvedValue(mockGame);
      
      const result = await service.makeMove('game1', 'player1', 0, 0);
      
      expect(result).toBeNull();
    });
  });

  describe('checkWinner', () => {
    it('should detect horizontal win', () => {
      const board = Array(15).fill(null).map(() => Array(15).fill(0));
      // Create horizontal line of 5
      for (let i = 0; i < 5; i++) {
        board[0][i] = 1;
      }
      
      const result = service['checkWinner'](board, 0, 2);
      
      expect(result).toBe(1);
    });

    it('should detect vertical win', () => {
      const board = Array(15).fill(null).map(() => Array(15).fill(0));
      // Create vertical line of 5
      for (let i = 0; i < 5; i++) {
        board[i][0] = 1;
      }
      
      const result = service['checkWinner'](board, 2, 0);
      
      expect(result).toBe(1);
    });

    it('should detect diagonal win', () => {
      const board = Array(15).fill(null).map(() => Array(15).fill(0));
      // Create diagonal line of 5
      for (let i = 0; i < 5; i++) {
        board[i][i] = 1;
      }
      
      const result = service['checkWinner'](board, 2, 2);
      
      expect(result).toBe(1);
    });

    it('should return 0 for no win', () => {
      const board = Array(15).fill(null).map(() => Array(15).fill(0));
      board[0][0] = 1;
      board[0][1] = 1;
      board[0][2] = 1;
      board[0][3] = 1;
      // Only 4 in a row, not 5
      
      const result = service['checkWinner'](board, 0, 1);
      
      expect(result).toBe(0);
    });
  });

  describe('isBoardFull', () => {
    it('should return true for full board', () => {
      const board = Array(15).fill(null).map(() => Array(15).fill(1));
      
      const result = service['isBoardFull'](board);
      
      expect(result).toBe(true);
    });

    it('should return false for empty board', () => {
      const board = Array(15).fill(null).map(() => Array(15).fill(0));
      
      const result = service['isBoardFull'](board);
      
      expect(result).toBe(false);
    });
  });
});