import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { GamesService } from '../src/games/games.service';
import { Line98Game } from '../src/database/schemas/line98-game.schema';
import { CaroGame } from '../src/database/schemas/caro-game.schema';

describe('Performance Tests - 10+ Concurrent Users', () => {
  let gamesService: GamesService;
  let mockLine98Model: any;
  let mockCaroModel: any;

  beforeEach(async () => {
    const mockLine98ModelValue = {
      new: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      save: jest.fn().mockResolvedValue({}),
    };

    const mockCaroModelValue = {
      new: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      save: jest.fn().mockResolvedValue({}),
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

    gamesService = module.get<GamesService>(GamesService);
    mockLine98Model = module.get(getModelToken(Line98Game.name));
    mockCaroModel = module.get(getModelToken(CaroGame.name));
  });

  describe('Latency Tests', () => {
    it('should handle Line 98 game operations with latency < 200ms', async () => {
      const userId = 'test-user';
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

      const startTime = Date.now();
      
      // Test multiple operations
      await gamesService.createLine98Game(userId);
      await gamesService.getLine98Game(userId, 'game-id');
      await gamesService.makeLine98Move(userId, 'game-id', {
        fromRow: 0,
        fromCol: 0,
        toRow: 1,
        toCol: 0,
      });
      
      const endTime = Date.now();
      const latency = endTime - startTime;

      expect(latency).toBeLessThan(200);
      console.log(`Line 98 operations latency: ${latency}ms`);
    });

    it('should handle Caro game operations with latency < 200ms', async () => {
      const userId = 'test-user';
      const mockGame = {
        _id: 'game-id',
        player1Id: userId,
        board: Array(15).fill(null).map(() => Array(15).fill(0)),
        currentPlayer: 1,
        isGameOver: false,
        save: jest.fn().mockResolvedValue({}),
      };

      mockCaroModel.new.mockReturnValue(mockGame);

      const startTime = Date.now();
      
      // Test multiple operations
      await gamesService.createCaroGame(userId);
      await gamesService.joinCaroGame('player2', { gameId: 'game-id' });
      await gamesService.makeCaroMove(userId, 'game-id', { x: 7, y: 7 });
      
      const endTime = Date.now();
      const latency = endTime - startTime;

      expect(latency).toBeLessThan(200);
      console.log(`Caro operations latency: ${latency}ms`);
    });
  });

  describe('Concurrent User Simulation', () => {
    it('should handle 10 concurrent Line 98 game operations efficiently', async () => {
      const concurrentUsers = 10;
      const promises = [];
      const latencies: number[] = [];

      for (let i = 0; i < concurrentUsers; i++) {
        const promise = new Promise<void>((resolve) => {
          const startTime = Date.now();
          
          gamesService.createLine98Game(`user${i}`)
            .then(() => {
              const endTime = Date.now();
              latencies.push(endTime - startTime);
              resolve();
            });
        });
        promises.push(promise);
      }

      const startTime = Date.now();
      await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);

      console.log(`\n=== 10 Concurrent Line 98 Operations ===`);
      console.log(`Total time: ${totalTime}ms`);
      console.log(`Average latency: ${avgLatency.toFixed(2)}ms`);
      console.log(`Max latency: ${maxLatency}ms`);

      expect(avgLatency).toBeLessThan(200);
      expect(maxLatency).toBeLessThan(500);
      expect(totalTime).toBeLessThan(1000);
    });

    it('should handle 10 concurrent Caro game operations efficiently', async () => {
      const concurrentUsers = 10;
      const promises = [];
      const latencies: number[] = [];

      for (let i = 0; i < concurrentUsers; i++) {
        const promise = new Promise<void>((resolve) => {
          const startTime = Date.now();
          
          gamesService.createCaroGame(`user${i}`)
            .then(() => {
              const endTime = Date.now();
              latencies.push(endTime - startTime);
              resolve();
            });
        });
        promises.push(promise);
      }

      const startTime = Date.now();
      await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);

      console.log(`\n=== 10 Concurrent Caro Operations ===`);
      console.log(`Total time: ${totalTime}ms`);
      console.log(`Average latency: ${avgLatency.toFixed(2)}ms`);
      console.log(`Max latency: ${maxLatency}ms`);

      expect(avgLatency).toBeLessThan(200);
      expect(maxLatency).toBeLessThan(500);
      expect(totalTime).toBeLessThan(1000);
    });
  });

  describe('Memory and Resource Management', () => {
    it('should handle large number of concurrent operations efficiently', async () => {
      const largeUserCount = 20;
      const promises = [];
      const latencies: number[] = [];

      for (let i = 0; i < largeUserCount; i++) {
        const promise = new Promise<void>((resolve) => {
          const startTime = Date.now();
          
          // Simulate multiple operations per user
          Promise.all([
            gamesService.createLine98Game(`user${i}`),
            gamesService.createCaroGame(`user${i}`),
          ]).then(() => {
            const endTime = Date.now();
            latencies.push(endTime - startTime);
            resolve();
          });
        });
        promises.push(promise);
      }

      const startTime = Date.now();
      await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);

      console.log(`\n=== ${largeUserCount} Concurrent Users Test ===`);
      console.log(`Total time: ${totalTime}ms`);
      console.log(`Average latency: ${avgLatency.toFixed(2)}ms`);
      console.log(`Max latency: ${maxLatency}ms`);

      expect(totalTime).toBeLessThan(5000);
      expect(avgLatency).toBeLessThan(200);
      expect(maxLatency).toBeLessThan(500);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet latency requirements for real-time gaming', async () => {
      const iterations = 100;
      const latencies: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        // Test game operations
        await gamesService.createLine98Game(`user${i}`);
        await gamesService.createCaroGame(`user${i}`);
        
        const endTime = Date.now();
        latencies.push(endTime - startTime);
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);
      const minLatency = Math.min(...latencies);
      const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(iterations * 0.95)];

      console.log(`\n=== Performance Benchmark (${iterations} operations) ===`);
      console.log(`Average latency: ${avgLatency.toFixed(2)}ms`);
      console.log(`Max latency: ${maxLatency}ms`);
      console.log(`Min latency: ${minLatency}ms`);
      console.log(`95th percentile: ${p95Latency}ms`);

      // Performance requirements
      expect(avgLatency).toBeLessThan(50);
      expect(maxLatency).toBeLessThan(200);
      expect(p95Latency).toBeLessThan(100);

      console.log(`✅ Performance requirements met!`);
    });
  });
});
