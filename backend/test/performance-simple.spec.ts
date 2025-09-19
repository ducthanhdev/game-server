import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { GamesService } from '../src/games/games.service';
import { Line98Game } from '../src/database/schemas/line98-game.schema';
import { CaroGame } from '../src/database/schemas/caro-game.schema';

describe('Performance Tests - Simple', () => {
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

  it('should handle Line 98 operations with latency < 200ms', async () => {
    const startTime = Date.now();
    
    // Test board generation
    const board = service['generateInitialLine98Board']();
    
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    expect(latency).toBeLessThan(200);
    expect(board).toHaveLength(9);
  });

  it('should handle Caro operations with latency < 200ms', async () => {
    const startTime = Date.now();
    
    // Test winner check
    const board = Array(15).fill(null).map(() => Array(15).fill(0));
    for (let i = 0; i < 5; i++) {
      board[0][i] = 1;
    }
    const winner = service['checkCaroWinner'](board, 0, 0);
    
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    expect(latency).toBeLessThan(200);
    expect(winner).toBe(1);
  });

  it('should handle concurrent operations efficiently', async () => {
    const operations = [];
    const startTime = Date.now();
    
    // Simulate 10 concurrent operations
    for (let i = 0; i < 10; i++) {
      operations.push(service['generateInitialLine98Board']());
    }
    
    await Promise.all(operations);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTimePerOperation = totalTime / operations.length;
    
    expect(avgTimePerOperation).toBeLessThan(50);
    expect(totalTime).toBeLessThan(500);
  });
});
