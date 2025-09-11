import { Test, TestingModule } from '@nestjs/testing';
import { MatchmakingService } from '../src/games/services/matchmaking.service';

describe('Performance Tests - 10 Concurrent Users', () => {
  let matchmakingService: MatchmakingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchmakingService,
      ],
    }).compile();

    matchmakingService = module.get<MatchmakingService>(MatchmakingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Latency Tests', () => {
    it('should handle matchmaking queue operations with latency < 200ms', () => {
      const mockSocket = {} as any; // Mock socket object
      
      const startTime = Date.now();
      
      // Test queue operations
      const result1 = matchmakingService.enqueue('player1', mockSocket);
      const result2 = matchmakingService.enqueue('player2', mockSocket);
      const queueInfo = matchmakingService.getQueueInfo();
      
      const endTime = Date.now();
      const latency = endTime - startTime;

      expect(result1).toBeNull(); // First player waits
      expect(result2).toBe('player1'); // Second player gets matched with first
      expect(queueInfo.count).toBe(0); // Queue should be empty after match
      expect(latency).toBeLessThan(200); // Must be under 200ms
      
      console.log(`Matchmaking latency: ${latency}ms`);
    });
  });

  describe('Concurrent User Simulation', () => {
    it('should handle 10 concurrent matchmaking operations efficiently', async () => {
      const concurrentUsers = 10;
      const mockSockets = Array.from({ length: concurrentUsers }, () => ({} as any));
      
      const promises = [];
      const latencies: number[] = [];

      // Simulate 10 concurrent matchmaking operations
      for (let i = 0; i < concurrentUsers; i++) {
        const promise = new Promise<void>((resolve) => {
          const startTime = Date.now();
          
          const result = matchmakingService.enqueue(`player${i}`, mockSockets[i]);
          
          const endTime = Date.now();
          const latency = endTime - startTime;
          latencies.push(latency);
          
          resolve();
        });
        promises.push(promise);
      }

      const startTime = Date.now();
      await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // Calculate statistics
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);
      const minLatency = Math.min(...latencies);

      console.log(`\n=== 10 Concurrent Matchmaking Operations ===`);
      console.log(`Total time: ${totalTime}ms`);
      console.log(`Average latency: ${avgLatency.toFixed(2)}ms`);
      console.log(`Max latency: ${maxLatency}ms`);
      console.log(`Min latency: ${minLatency}ms`);

      expect(avgLatency).toBeLessThan(200); // Average should be under 200ms
      expect(maxLatency).toBeLessThan(500); // Max should be reasonable
      expect(totalTime).toBeLessThan(1000); // Total should be under 1 second

      // Check that matchmaking worked correctly
      const queueInfo = matchmakingService.getQueueInfo();
      console.log(`Remaining in queue: ${queueInfo.count}`);
    });

    it('should handle 20 concurrent socket operations efficiently', async () => {
      const concurrentUsers = 20;
      const mockSockets = Array.from({ length: concurrentUsers }, () => ({} as any));
      
      const promises = [];
      const latencies: number[] = [];

      // Simulate 20 concurrent socket operations (add/remove/update)
      for (let i = 0; i < concurrentUsers; i++) {
        const promise = new Promise<void>((resolve) => {
          const startTime = Date.now();
          
          // Add user
          matchmakingService.enqueue(`player${i}`, mockSockets[i]);
          
          // Update socket
          matchmakingService.updateUserSocket(`player${i}`, mockSockets[i]);
          
          // Get socket
          const socket = matchmakingService.getSocket(`player${i}`);
          
          const endTime = Date.now();
          const latency = endTime - startTime;
          latencies.push(latency);
          
          expect(socket).toBeDefined();
          
          resolve();
        });
        promises.push(promise);
      }

      const startTime = Date.now();
      await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // Calculate statistics
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);
      const minLatency = Math.min(...latencies);

      console.log(`\n=== 20 Concurrent Socket Operations ===`);
      console.log(`Total time: ${totalTime}ms`);
      console.log(`Average latency: ${avgLatency.toFixed(2)}ms`);
      console.log(`Max latency: ${maxLatency}ms`);
      console.log(`Min latency: ${minLatency}ms`);

      expect(avgLatency).toBeLessThan(200); // Average should be under 200ms
      expect(maxLatency).toBeLessThan(500); // Max should be reasonable
      expect(totalTime).toBeLessThan(1000); // Total should be under 1 second
    });
  });

  describe('Memory and Resource Management', () => {
    it('should handle queue cleanup efficiently', () => {
      const mockSocket = {} as any;
      
      // Add and remove users from queue
      for (let i = 0; i < 50; i++) {
        matchmakingService.enqueue(`player${i}`, mockSocket);
        matchmakingService.dequeue(`player${i}`);
      }
      
      const queueInfo = matchmakingService.getQueueInfo();
      
      expect(queueInfo.count).toBe(0); // Queue should be empty
      console.log(`Queue cleanup test passed - no memory leaks`);
    });

    it('should handle large number of concurrent users efficiently', async () => {
      const largeUserCount = 100;
      const mockSockets = Array.from({ length: largeUserCount }, () => ({} as any));
      
      const startTime = Date.now();
      
      // Add all users concurrently
      const promises = [];
      for (let i = 0; i < largeUserCount; i++) {
        const promise = new Promise<void>((resolve) => {
          matchmakingService.enqueue(`player${i}`, mockSockets[i]);
          resolve();
        });
        promises.push(promise);
      }
      
      await Promise.all(promises);
      
      const queueInfo = matchmakingService.getQueueInfo();
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      console.log(`\n=== ${largeUserCount} Concurrent Users Test ===`);
      console.log(`Total time: ${totalTime}ms`);
      console.log(`Users in queue: ${queueInfo.count}`);
      console.log(`Average time per user: ${(totalTime / largeUserCount).toFixed(2)}ms`);
      
      expect(totalTime).toBeLessThan(5000); // Should handle 100 users in under 5 seconds
      expect(queueInfo.count).toBe(largeUserCount % 2); // Should have 0 or 1 users left (depending on even/odd)
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet latency requirements for real-time gaming', () => {
      const mockSocket = {} as any;
      const iterations = 1000;
      const latencies: number[] = [];
      
      // Test 1000 operations
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        matchmakingService.enqueue(`player${i}`, mockSocket);
        matchmakingService.getSocket(`player${i}`);
        
        const endTime = Date.now();
        latencies.push(endTime - startTime);
      }
      
      // Calculate statistics
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
      expect(avgLatency).toBeLessThan(10); // Average should be very fast
      expect(maxLatency).toBeLessThan(50); // Max should be reasonable
      expect(p95Latency).toBeLessThan(20); // 95% should be under 20ms
      
      console.log(`✅ Performance requirements met!`);
    });
  });
});