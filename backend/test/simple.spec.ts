import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { GamesService } from '../src/games/games.service';
import { Line98Game } from '../src/database/schemas/line98-game.schema';
import { CaroGame } from '../src/database/schemas/caro-game.schema';

describe('Simple Tests', () => {
  let service: GamesService;

  beforeEach(async () => {
    const mockLine98Model = {
      new: jest.fn().mockReturnValue({
        save: jest.fn().mockResolvedValue({}),
      }),
      findOne: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
    };

    const mockCaroModel = {
      new: jest.fn().mockReturnValue({
        save: jest.fn().mockResolvedValue({}),
      }),
      findOne: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        {
          provide: getModelToken(Line98Game.name),
          useValue: mockLine98Model,
        },
        {
          provide: getModelToken(CaroGame.name),
          useValue: mockCaroModel,
        },
      ],
    }).compile();

    service = module.get<GamesService>(GamesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate initial Line 98 board', () => {
    const board = service['generateInitialLine98Board']();
    expect(board).toHaveLength(9);
    expect(board[0]).toHaveLength(9);
  });

  it('should check Caro winner correctly', () => {
    const board = Array(15).fill(null).map(() => Array(15).fill(0));
    // Create a winning line
    for (let i = 0; i < 5; i++) {
      board[0][i] = 1;
    }
    
    const winner = service['checkCaroWinner'](board, 0, 0);
    expect(winner).toBe(1);
  });

  it('should detect no winner', () => {
    const board = Array(15).fill(null).map(() => Array(15).fill(0));
    board[0][0] = 1;
    
    const winner = service['checkCaroWinner'](board, 0, 0);
    expect(winner).toBe(0);
  });
});
