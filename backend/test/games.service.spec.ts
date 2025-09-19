import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { GamesService } from '../src/games/games.service';
import { Line98Game } from '../src/database/schemas/line98-game.schema';
import { CaroGame } from '../src/database/schemas/caro-game.schema';

describe('GamesService', () => {
  let service: GamesService;
  let mockLine98Model: any;
  let mockCaroModel: any;

  beforeEach(async () => {
    const mockLine98ModelValue = {
      new: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      save: jest.fn(),
    };

    const mockCaroModelValue = {
      new: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        {
          provide: getModelToken(Line98Game.name),
          useValue: mockLine98ModelValue,
        },
        {
          provide: getModelToken(CaroGame.name),
          useValue: mockCaroModelValue,
        },
      ],
    }).compile();

    service = module.get<GamesService>(GamesService);
    mockLine98Model = module.get(getModelToken(Line98Game.name));
    mockCaroModel = module.get(getModelToken(CaroGame.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Line 98 Game', () => {
    it('should create a new Line 98 game', async () => {
      const userId = 'test-user-id';
      const mockGame = {
        _id: 'game-id',
        playerId: userId,
        gameState: {
          board: Array(9).fill(null).map(() => Array(9).fill(1)),
          score: 0,
          isGameOver: false,
          selectedBall: null,
        },
        score: 0,
        isGameOver: false,
        save: jest.fn().mockResolvedValue({}),
      };

      mockLine98Model.new.mockReturnValue(mockGame);

      const result = await service.createLine98Game(userId);

      expect(mockLine98Model.new).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should select a ball in Line 98', () => {
      const gameState = {
        board: Array(9).fill(null).map(() => Array(9).fill(1)),
        score: 0,
        isGameOver: false,
        selectedBall: null,
      };

      const result = service.selectBall(gameState, 0, 0);

      expect(result.selectedBall).toEqual({ row: 0, col: 0 });
    });

    it('should not select ball if game is over', () => {
      const gameState = {
        board: Array(9).fill(null).map(() => Array(9).fill(1)),
        score: 0,
        isGameOver: true,
        selectedBall: null,
      };

      const result = service.selectBall(gameState, 0, 0);

      expect(result).toBe(gameState);
    });
  });

  describe('Caro Game', () => {
    it('should create a new Caro game', async () => {
      const userId = 'test-user-id';
      const mockGame = {
        _id: 'game-id',
        player1Id: userId,
        board: Array(15).fill(null).map(() => Array(15).fill(0)),
        currentPlayer: 1,
        isGameOver: false,
        save: jest.fn().mockResolvedValue({}),
      };

      mockCaroModel.new.mockReturnValue(mockGame);

      const result = await service.createCaroGame(userId);

      expect(mockCaroModel.new).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should join a Caro game', async () => {
      const gameId = 'game-id';
      const player2Id = 'player2-id';
      const mockGame = {
        _id: gameId,
        player1Id: 'player1-id',
        player2Id: null,
        isGameOver: false,
        save: jest.fn().mockResolvedValue({}),
      };

      mockCaroModel.findById.mockResolvedValue(mockGame);

      const result = await service.joinCaroGame(player2Id, { gameId });

      expect(mockCaroModel.findById).toHaveBeenCalledWith(gameId);
      expect(result).toBeDefined();
    });

    it('should not join a game that is already full', async () => {
      const gameId = 'game-id';
      const player2Id = 'player2-id';
      const mockGame = {
        _id: gameId,
        player1Id: 'player1-id',
        player2Id: 'existing-player',
        isGameOver: false,
      };

      mockCaroModel.findById.mockResolvedValue(mockGame);

      const result = await service.joinCaroGame(player2Id, { gameId });

      expect(result).toBeNull();
    });
  });
});
