import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Line98Game, Line98GameDocument } from '../database/schemas/line98-game.schema';
import { CaroGame, CaroGameDocument } from '../database/schemas/caro-game.schema';
import { CreateLine98GameDto, MakeLine98MoveDto, CreateCaroGameDto, MakeCaroMoveDto, JoinCaroGameDto } from './dto/games.dto';

@Injectable()
export class GamesService {
  // Line 98 Constants
  private readonly ROWS = 9;
  private readonly COLS = 9;
  private readonly LINE_LENGTH = 5;
  private readonly SPAWN_COUNT = 3;
  private readonly COLORS = 7; // 1-7 colors

  constructor(
    @InjectModel(Line98Game.name)
    private line98Model: Model<Line98GameDocument>,
    @InjectModel(CaroGame.name)
    private caroModel: Model<CaroGameDocument>,
  ) {}

  // Line 98 Game Methods
  async createLine98Game(userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const game = new this.line98Model({
      playerId: new Types.ObjectId(userId),
      gameState: {
        board: this.generateInitialLine98Board(),
        score: 0,
        isGameOver: false,
        selectedBall: null,
      },
      score: 0,
      isGameOver: false,
    });

    const savedGame = await game.save();
    return savedGame;
  }

  async getLine98Game(userId: string, gameId: string) {
    const game = await this.line98Model.findOne({ 
      _id: gameId, 
      playerId: new Types.ObjectId(userId) 
    });
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    return game;
  }

  async makeLine98Move(userId: string, gameId: string, moveDto: MakeLine98MoveDto) {
    const game = await this.getLine98Game(userId, gameId);
    
    if (game.isGameOver) {
      throw new BadRequestException('Game is already over');
    }

    const { fromRow, fromCol, toRow, toCol } = moveDto;
    const newGameState = this.processLine98Move(game.gameState, fromRow, fromCol, toRow, toCol);
    
    // Update game state and auto-save progress
    game.gameState = newGameState;
    game.score = newGameState.score;
    game.isGameOver = newGameState.isGameOver;
    game.lastSavedAt = new Date(); // Auto-save with timestamp
    
    return game.save();
  }

  async getLine98Hint(userId: string, gameId: string) {
    const game = await this.getLine98Game(userId, gameId);
    return this.findLine98Hint(game.gameState);
  }


  // Find latest saved game for user
  async getLatestLine98Game(userId: string) {
    try {
      if (!userId || !Types.ObjectId.isValid(userId)) {
        return null;
      }
      
      const game = await this.line98Model
        .findOne({ 
          playerId: new Types.ObjectId(userId),
          isGameOver: false 
        })
        .sort({ createdAt: -1 })
        .exec();
      
      return game;
    } catch (error) {
      return null;
    }
  }


  // Caro Game Methods
  async createCaroGame(userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const game = new this.caroModel({
      player1Id: new Types.ObjectId(userId),
      board: Array(15).fill(null).map(() => Array(15).fill(0)),
      currentPlayer: 1,
      isGameOver: false,
    });

    return game.save();
  }

  async joinCaroGame(userId: string, joinDto: { gameId: string; opponentId?: string }) {
    const game = await this.caroModel.findById(joinDto.gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.player2Id || game.isGameOver) {
      throw new BadRequestException('Game is not available');
    }

    game.player2Id = new Types.ObjectId(userId);
    return game.save();
  }

  async getCaroGame(userId: string, gameId: string) {
    const game = await this.caroModel.findById(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.player1Id.toString() !== userId && game.player2Id.toString() !== userId) {
      throw new ForbiddenException('You are not a player in this game');
    }

    return game;
  }

  async makeCaroMove(userId: string, gameId: string, moveDto: MakeCaroMoveDto) {
    const game = await this.getCaroGame(userId, gameId);
    
    if (game.isGameOver) {
      throw new BadRequestException('Game is already over');
    }

    const expectedPlayer = game.currentPlayer === 1 ? game.player1Id : game.player2Id;
    if (expectedPlayer.toString() !== userId) {
      throw new BadRequestException('It is not your turn');
    }

    const { x, y } = moveDto;
    if (game.board[x][y] !== 0) {
      throw new BadRequestException('Position is already occupied');
    }

    // Make the move
    game.board[x][y] = game.currentPlayer;
    
    // Check for win
    const winner = this.checkCaroWinner(game.board, x, y);
    if (winner !== 0) {
      game.isGameOver = true;
      game.winnerId = winner === 1 ? game.player1Id : game.player2Id;
    } else if (this.isCaroBoardFull(game.board)) {
      game.isGameOver = true;
    } else {
      game.currentPlayer = game.currentPlayer === 1 ? 2 : 1;
    }

    return game.save();
  }

  async getAvailableCaroGames() {
    return this.caroModel.find({
      player2Id: null,
      isGameOver: false,
    }).sort({ createdAt: -1 });
  }

  async getCaroGameHistory(userId: string, targetUserId: string) {
    if (userId !== targetUserId) {
      throw new ForbiddenException('You can only view your own game history');
    }

    return this.caroModel.find({
      $or: [
        { player1Id: userId },
        { player2Id: userId },
      ],
    }).sort({ createdAt: -1 });
  }

  // Line 98 Helper Methods
  selectBall(gameState: any, row: number, col: number) {
    if (gameState.isGameOver) return gameState;

    const newState = { ...gameState };
    newState.selectedBall = { row, col };
    return newState;
  }

  // Helper Methods
  private generateInitialLine98Board(): number[][] {
    const board: number[][] = [];
    for (let i = 0; i < this.ROWS; i++) {
      board[i] = [];
      for (let j = 0; j < this.COLS; j++) {
        board[i][j] = 0;
      }
    }
    
    // Add initial balls (5-8 balls for balanced start)
    const numBalls = 6;
    this.spawnRandomBalls(board, numBalls);
    
    return board;
  }

  private spawnRandomBalls(board: number[][], count: number): number {
    const emptyCells = this.getEmptyCells(board);
    if (emptyCells.length === 0) {
      console.log('No empty cells available for spawning');
      return 0;
    }
    
    console.log(`Attempting to spawn ${count} balls in ${emptyCells.length} empty cells`);
    
    let placed = 0;
    const availableCells = [...emptyCells]; // Copy the array
    
    for (let i = 0; i < count && availableCells.length > 0; i++) {
      // Pick a random cell from available cells
      const randomIndex = Math.floor(Math.random() * availableCells.length);
      const [row, col] = availableCells[randomIndex];
      
      // Triple check the cell is still empty
      if (board[row][col] === 0) {
        const color = Math.floor(Math.random() * this.COLORS) + 1;
        board[row][col] = color;
        placed++;
        console.log(`Placed ball color ${color} at (${row},${col})`);
        
        // Remove this cell from available cells to prevent duplicates
        availableCells.splice(randomIndex, 1);
      } else {
        console.log(`Cell (${row},${col}) is not empty, skipping...`);
        // Remove this cell from available cells since it's not empty
        availableCells.splice(randomIndex, 1);
      }
    }
    
    return placed;
  }

  private getEmptyCells(board: number[][]): [number, number][] {
    const empty: [number, number][] = [];
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (board[r][c] === 0) {
          empty.push([r, c]);
        }
      }
    }
    return empty;
  }

  private bfsPath(board: number[][], start: [number, number], target: [number, number]): [number, number][] | null {
    const [sr, sc] = start;
    const [tr, tc] = target;
    
    if (sr === tr && sc === tc) return [];
    
    const queue: [number, number][] = [];
    const visited: boolean[][] = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(false));
    const parent: ([number, number] | null)[][] = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(null));
    const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
    
    visited[sr][sc] = true;
    queue.push([sr, sc]);
    
    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        
        if (!this.inBoard(nr, nc)) continue;
        if (visited[nr][nc]) continue;
        if (board[nr][nc] !== 0 && !(nr === tr && nc === tc)) continue;
        
        visited[nr][nc] = true;
        parent[nr][nc] = [r, c];
        
        if (nr === tr && nc === tc) {
          // Reconstruct path
          const path: [number, number][] = [];
          let cur: [number, number] | null = [tr, tc];
          while (cur && !(cur[0] === sr && cur[1] === sc)) {
            path.push(cur);
            cur = parent[cur[0]][cur[1]];
          }
          return path.reverse();
        }
        
        queue.push([nr, nc]);
      }
    }
    
    return null; // No path found
  }

  private inBoard(r: number, c: number): boolean {
    return r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS;
  }

  processLine98Move(gameState: any, fromRow: number, fromCol: number, toRow: number, toCol: number) {
    // Deep clone gameState to avoid mutation
    const newState = {
      ...gameState,
      board: gameState.board ? gameState.board.map(row => [...row]) : null,
      score: gameState.score || 0,
      isGameOver: gameState.isGameOver || false,
      selectedBall: gameState.selectedBall || null
    };
    
    // Validate gameState structure
    if (!newState.board || !Array.isArray(newState.board)) {
      throw new BadRequestException('Invalid game state');
    }
    
    const board = newState.board;
    
    // Validate move
    if (board[fromRow][fromCol] === 0 || board[toRow][toCol] !== 0) {
      throw new BadRequestException('Invalid move: source must have ball, target must be empty');
    }
    
    // Check if path exists using BFS
    const path = this.bfsPath(board, [fromRow, fromCol], [toRow, toCol]);
    if (!path) {
      throw new BadRequestException('No valid path found');
    }
    
    // Move the ball
    const ballColor = board[fromRow][fromCol];
    board[fromRow][fromCol] = 0;
    board[toRow][toCol] = ballColor;
    
    // Check for ALL lines after move
    const cellsToRemove = this.collectAllLines(board);
    let score = newState.score || 0;
    
    if (cellsToRemove.length > 0) {
      // Remove lines and add score
      this.removeCells(board, cellsToRemove);
      score += cellsToRemove.length;
      // Don't spawn new balls if lines were cleared
    } else {
      // Only spawn new balls if no lines were cleared
      // Spawn 3 new balls
      const placed = this.spawnRandomBalls(board, this.SPAWN_COUNT);
      
      // Check for lines after spawning
      const cellsToRemove2 = this.collectAllLines(board);
      if (cellsToRemove2.length > 0) {
        this.removeCells(board, cellsToRemove2);
        score += cellsToRemove2.length;
      }
      
      // Check if game over (no empty cells)
      const emptyCellsAfterSpawn = this.getEmptyCells(board);
      if (emptyCellsAfterSpawn.length === 0) {
        newState.isGameOver = true;
      }
    }
    
    newState.board = board;
    newState.score = score;
    newState.selectedBall = null;
    
    return newState;
  }

  private collectLineCellsAt(board: number[][], r: number, c: number): [number, number][] {
    const color = board[r][c];
    if (color === 0) return [];
    
    const dirs = [[0,1], [1,0], [1,1], [1,-1]]; // horizontal, vertical, diagonal \, diagonal /
    const result = new Set<string>();
    
    for (const [dr, dc] of dirs) {
      const cells: [number, number][] = [[r, c]];
      
      // Forward direction
      let rr = r + dr, cc = c + dc;
      while (this.inBoard(rr, cc) && board[rr][cc] === color) {
        cells.push([rr, cc]);
        rr += dr; cc += dc;
      }
      
      // Backward direction
      rr = r - dr; cc = c - dc;
      while (this.inBoard(rr, cc) && board[rr][cc] === color) {
        cells.push([rr, cc]);
        rr -= dr; cc -= dc;
      }
      
      if (cells.length >= this.LINE_LENGTH) {
        for (const cell of cells) {
          result.add(`${cell[0]},${cell[1]}`);
        }
      }
    }
    
    return Array.from(result).map(s => s.split(',').map(Number) as [number, number]);
  }

  private collectAllLines(board: number[][]): [number, number][] {
    const bag = new Set<string>();
    
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (board[r][c] === 0) continue;
        const cells = this.collectLineCellsAt(board, r, c);
        for (const cell of cells) {
          bag.add(`${cell[0]},${cell[1]}`);
        }
      }
    }
    
    return Array.from(bag).map(s => s.split(',').map(Number) as [number, number]);
  }

  private removeCells(board: number[][], cells: [number, number][]): void {
    for (const [r, c] of cells) {
      board[r][c] = 0;
    }
  }


  private addNewLine98Balls(board: number[][]): void {
    const emptyCells: { row: number; col: number }[] = [];
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }

    // Add 3 new balls
    for (let i = 0; i < Math.min(3, emptyCells.length); i++) {
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      const cell = emptyCells.splice(randomIndex, 1)[0];
      board[cell.row][cell.col] = Math.floor(Math.random() * 5) + 1;
    }
  }

  private isLine98GameOver(board: number[][]): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) continue;

        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (const [dr, dc] of directions) {
          const newRow = row + dr;
          const newCol = col + dc;
          if (newRow >= 0 && newRow < 9 && 
              newCol >= 0 && newCol < 9 && 
              board[newRow][newCol] === 0) {
            return false;
          }
        }
      }
    }
    return true;
  }

  findLine98Hint(gameState: any): { fromRow: number; fromCol: number; toRow: number; toCol: number } | null {
    const board = gameState.board;
    const bestHint = this.getBestHint(board);
    return bestHint;
  }

  // Optimized Smart Hint Algorithm
  private getBestHint(board: number[][]): { fromRow: number; fromCol: number; toRow: number; toCol: number } | null {
    let best: any = null;
    
    // Fast pre-filter: Find immediate clear moves first
    const immediateMoves = this.findImmediateClearMoves(board);
    if (immediateMoves.length > 0) {
      return this.selectBestImmediate(immediateMoves);
    }
    
    // Generate preview nextBalls for smart candidates only
    const nextBalls = this.generateNextBalls(this.SPAWN_COUNT);
    
    for (let sr = 0; sr < this.ROWS; sr++) {
      for (let sc = 0; sc < this.COLS; sc++) {
        const color = board[sr][sc];
        if (color === 0) continue;
        
        const targets = this.bfsReachableEmpties(board, sr, sc);
        
        // Pre-filter targets by potential (skip obviously bad moves)
        const goodTargets = targets.filter(([tr, tc]) => 
          this.quickPotentialCheck(board, tr, tc, color)
        );
        
        for (const [tr, tc] of goodTargets) {
          const stats = this.evaluatePlacement(board, tr, tc, color);
          let score = 0;
          
          // Level 1 scoring
          if (stats.immediateClearCount > 0) {
            score += 1000 + stats.immediateClearCount;
          }
          score += 5 * stats.longestRun;
          score += 3 * stats.openEnds;
          score += 1 * stats.mobility;
          
          // Level 2: Color hotspot bonus (optimized)
          const colorBonus = this.fastColorHotspots(board, tr, tc, color);
          score += 8 * colorBonus;
          
          // Level 2.5: Light future risk analysis (only for top candidates)
          if (score > (best?.score || 0) - 5) {
            const futureRisk = this.lightFutureAnalysis(board, tr, tc, color, nextBalls);
            score -= 1 * futureRisk.expectedBlock;
            score += 2 * futureRisk.expectedHelp;
            score -= 3 * futureRisk.gameOverRisk;
          }
          
          score += this.centerBias(tr, tc);
          
          const candidate = {
            fromRow: sr,
            fromCol: sc,
            toRow: tr,
            toCol: tc,
            score,
            stats: { ...stats, colorBonus }
          };
          
          best = this.betterCandidate(best, candidate);
          
          // Early termination for very good moves
          if (score > 1010) break;
        }
      }
    }
    
    return best;
  }

  // Fast pre-filter for immediate clear moves
  private findImmediateClearMoves(board: number[][]): any[] {
    const moves: any[] = [];
    
    for (let sr = 0; sr < this.ROWS; sr++) {
      for (let sc = 0; sc < this.COLS; sc++) {
        const color = board[sr][sc];
        if (color === 0) continue;
        
        // Only check adjacent and nearby empty cells for immediate clears
        const nearbyTargets = this.getNearbyEmptyCells(board, sr, sc, 4);
        
        for (const [tr, tc] of nearbyTargets) {
          const lineResult = this.evalLineAt(board, tr, tc, color);
          if (lineResult.clearCells.length > 0) {
            moves.push({
              fromRow: sr, fromCol: sc, toRow: tr, toCol: tc,
              clearCount: lineResult.clearCells.length,
              score: 1000 + lineResult.clearCells.length
            });
          }
        }
      }
    }
    
    return moves.sort((a, b) => b.score - a.score);
  }

  // Select best immediate clear move
  private selectBestImmediate(moves: any[]): any {
    return moves[0]; // Already sorted by score
  }

  // Quick potential check to filter out bad moves early
  private quickPotentialCheck(board: number[][], tr: number, tc: number, color: number): boolean {
    // Check if there's at least one same color ball within 3 cells
    for (let r = Math.max(0, tr - 3); r <= Math.min(this.ROWS - 1, tr + 3); r++) {
      for (let c = Math.max(0, tc - 3); c <= Math.min(this.COLS - 1, tc + 3); c++) {
        if (board[r][c] === color) return true;
      }
    }
    
    // Or check if it's in a strategic position (center area)
    const centerR = (this.ROWS - 1) / 2;
    const centerC = (this.COLS - 1) / 2;
    const distFromCenter = Math.abs(tr - centerR) + Math.abs(tc - centerC);
    
    return distFromCenter <= 3;
  }

  // Get nearby empty cells within radius
  private getNearbyEmptyCells(board: number[][], sr: number, sc: number, radius: number): [number, number][] {
    const cells: [number, number][] = [];
    
    for (let r = Math.max(0, sr - radius); r <= Math.min(this.ROWS - 1, sr + radius); r++) {
      for (let c = Math.max(0, sc - radius); c <= Math.min(this.COLS - 1, sc + radius); c++) {
        if (board[r][c] === 0) {
          // Check if reachable using simple distance instead of BFS for speed
          const distance = Math.abs(r - sr) + Math.abs(c - sc);
          if (distance <= radius) {
            cells.push([r, c]);
          }
        }
      }
    }
    
    return cells;
  }

  // Fast color hotspot evaluation
  private fastColorHotspots(board: number[][], tr: number, tc: number, color: number): number {
    let bonus = 0;
    const searchRadius = 2; // Reduced from 3 to 2
    
    for (let r = Math.max(0, tr - searchRadius); r <= Math.min(this.ROWS - 1, tr + searchRadius); r++) {
      for (let c = Math.max(0, tc - searchRadius); c <= Math.min(this.COLS - 1, tc + searchRadius); c++) {
        if (board[r][c] === color) {
          const distance = Math.abs(tr - r) + Math.abs(tc - c);
          bonus += (searchRadius + 1 - distance) * 0.5;
        }
      }
    }
    
    return bonus;
  }

  // Light future analysis (simplified Monte Carlo)
  private lightFutureAnalysis(
    board: number[][], 
    tr: number, 
    tc: number, 
    color: number, 
    nextBalls: number[]
  ): { expectedBlock: number; expectedHelp: number; gameOverRisk: number } {
    let blockCount = 0;
    let helpCount = 0;
    
    // Only check if nextBalls would be placed near our target
    const emptyCells = this.getEmptyCells(board);
    const nearbyEmpties = emptyCells.filter(([r, c]) => 
      Math.abs(r - tr) + Math.abs(c - tc) <= 2
    );
    
    if (nearbyEmpties.length === 0) {
      return { expectedBlock: 0, expectedHelp: 0, gameOverRisk: 0 };
    }
    
    // Simple probability analysis instead of full simulation
    for (const ballColor of nextBalls) {
      const probability = nearbyEmpties.length / Math.max(emptyCells.length, 1);
      
      if (ballColor === color) {
        helpCount += probability;
      } else {
        blockCount += probability * 0.5;
      }
    }
    
    const gameOverRisk = emptyCells.length <= 10 ? 0.3 : 0;
    
    return {
      expectedBlock: blockCount,
      expectedHelp: helpCount, 
      gameOverRisk
    };
  }

  // Level 2: Evaluate color hotspots and connection potential
  private evaluateColorHotspots(board: number[][], tr: number, tc: number, color: number): number {
    let bonus = 0;
    const searchRadius = 3; // Search within 3 cells
    
    // Find existing lines of same color within radius
    for (let r = Math.max(0, tr - searchRadius); r <= Math.min(this.ROWS - 1, tr + searchRadius); r++) {
      for (let c = Math.max(0, tc - searchRadius); c <= Math.min(this.COLS - 1, tc + searchRadius); c++) {
        if (board[r][c] === color) {
          const distance = Math.abs(tr - r) + Math.abs(tc - c);
          const lineInfo = this.analyzeExistingLine(board, r, c, color);
          
          // Bonus for connecting to existing lines
          if (lineInfo.length >= 2) {
            bonus += (lineInfo.length - 1) * (4 - distance) * 0.5;
          }
          
          // Extra bonus for creating bridges between isolated groups
          if (this.wouldCreateBridge(board, tr, tc, r, c, color)) {
            bonus += 3;
          }
        }
      }
    }
    
    return bonus;
  }

  // Level 3: Monte Carlo simulation with nextBalls preview
  private monteCarloSimulation(
    board: number[][], 
    sr: number, 
    sc: number, 
    tr: number, 
    tc: number, 
    color: number, 
    nextBalls: number[]
  ): { expectedBlock: number; expectedHelp: number; gameOverRisk: number } {
    const simulations = 15; // Number of Monte Carlo runs
    let totalBlock = 0;
    let totalHelp = 0;
    let gameOverCount = 0;
    
    for (let sim = 0; sim < simulations; sim++) {
      // Create simulation board
      const simBoard = board.map(row => [...row]);
      
      // Apply the proposed move
      simBoard[sr][sc] = 0;
      simBoard[tr][tc] = color;
      
      // Remove any lines created by the move
      const clearedCells = this.collectAllLines(simBoard);
      if (clearedCells.length > 0) {
        this.removeCells(simBoard, clearedCells);
      } else {
        // Only simulate nextBalls if no lines were cleared
        const result = this.simulateNextBalls(simBoard, nextBalls, tr, tc, color);
        totalBlock += result.blockingEffect;
        totalHelp += result.helpingEffect;
        if (result.gameOver) gameOverCount++;
      }
    }
    
    return {
      expectedBlock: totalBlock / simulations,
      expectedHelp: totalHelp / simulations,
      gameOverRisk: gameOverCount / simulations
    };
  }

  // Simulate placement of nextBalls and evaluate impact
  private simulateNextBalls(
    board: number[][], 
    nextBalls: number[], 
    moveTargetR: number, 
    moveTargetC: number, 
    moveColor: number
  ): { blockingEffect: number; helpingEffect: number; gameOver: boolean } {
    const emptyCells = this.getEmptyCells(board);
    let blockingEffect = 0;
    let helpingEffect = 0;
    
    if (emptyCells.length === 0) {
      return { blockingEffect: 0, helpingEffect: 0, gameOver: true };
    }
    
    // Randomly place nextBalls
    const placedBalls: Array<{r: number, c: number, color: number}> = [];
    const availableCells = [...emptyCells];
    
    for (let i = 0; i < Math.min(nextBalls.length, availableCells.length); i++) {
      const randomIndex = Math.floor(Math.random() * availableCells.length);
      const [r, c] = availableCells.splice(randomIndex, 1)[0];
      const ballColor = nextBalls[i];
      
      placedBalls.push({ r, c, color: ballColor });
      board[r][c] = ballColor;
    }
    
    // Evaluate impact of each placed ball
    for (const ball of placedBalls) {
      // Calculate distance to our move target
      const distance = Math.abs(ball.r - moveTargetR) + Math.abs(ball.c - moveTargetC);
      
      if (distance <= 2) {
        if (ball.color === moveColor) {
          // Same color nearby = potential help
          helpingEffect += (3 - distance) * 0.5;
        } else {
          // Different color nearby = potential blocking
          blockingEffect += (3 - distance) * 0.3;
        }
      }
      
      // Check if this ball blocks future expansion paths
      const mobilityLoss = this.calculateMobilityLoss(board, moveTargetR, moveTargetC, ball.r, ball.c);
      blockingEffect += mobilityLoss;
      
      // Check if this ball creates new opportunities for same color
      if (ball.color === moveColor) {
        const connectionPotential = this.evaluateConnectionPotential(board, ball.r, ball.c, moveColor);
        helpingEffect += connectionPotential;
      }
    }
    
    // Clean up board
    for (const ball of placedBalls) {
      board[ball.r][ball.c] = 0;
    }
    
    const gameOver = (emptyCells.length - placedBalls.length) <= 5; // Near game over
    
    return { blockingEffect, helpingEffect, gameOver };
  }

  // Generate preview nextBalls
  private generateNextBalls(count: number): number[] {
    const balls: number[] = [];
    for (let i = 0; i < count; i++) {
      balls.push(Math.floor(Math.random() * this.COLORS) + 1);
    }
    return balls;
  }

  // Analyze existing line properties
  private analyzeExistingLine(board: number[][], r: number, c: number, color: number): number[] {
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    let maxLength = 1;
    
    for (const [dr, dc] of dirs) {
      let length = 1;
      
      // Forward
      let rr = r + dr, cc = c + dc;
      while (this.inBoard(rr, cc) && board[rr][cc] === color) {
        length++;
        rr += dr;
        cc += dc;
      }
      
      // Backward
      rr = r - dr;
      cc = c - dc;
      while (this.inBoard(rr, cc) && board[rr][cc] === color) {
        length++;
        rr -= dr;
        cc -= dc;
      }
      
      maxLength = Math.max(maxLength, length);
    }
    
    return [maxLength];
  }

  // Check if move would create bridge between isolated groups
  private wouldCreateBridge(board: number[][], tr: number, tc: number, existingR: number, existingC: number, color: number): boolean {
    // Simplified bridge detection - check if connecting distant same-color groups
    const distance = Math.abs(tr - existingR) + Math.abs(tc - existingC);
    return distance >= 3 && distance <= 5;
  }

  // Calculate mobility loss from ball placement
  private calculateMobilityLoss(board: number[][], targetR: number, targetC: number, ballR: number, ballC: number): number {
    const distance = Math.abs(targetR - ballR) + Math.abs(targetC - ballC);
    if (distance <= 2) {
      return (3 - distance) * 0.2; // Closer balls cause more mobility loss
    }
    return 0;
  }

  // Evaluate connection potential for same color balls
  private evaluateConnectionPotential(board: number[][], r: number, c: number, color: number): number {
    let potential = 0;
    const searchRadius = 2;
    
    for (let rr = Math.max(0, r - searchRadius); rr <= Math.min(this.ROWS - 1, r + searchRadius); rr++) {
      for (let cc = Math.max(0, c - searchRadius); cc <= Math.min(this.COLS - 1, c + searchRadius); cc++) {
        if (board[rr][cc] === color) {
          const distance = Math.abs(r - rr) + Math.abs(c - cc);
          potential += (searchRadius + 1 - distance) * 0.1;
        }
      }
    }
    
    return potential;
  }

  // Find all reachable empty cells from a ball using BFS
  private bfsReachableEmpties(board: number[][], sr: number, sc: number): [number, number][] {
    const queue: [number, number][] = [[sr, sc]];
    const visited: boolean[][] = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(false));
    visited[sr][sc] = true;
    const targets: [number, number][] = [];
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    
    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        
        if (!this.inBoard(nr, nc) || visited[nr][nc]) continue;
        
        if (board[nr][nc] === 0) {
          visited[nr][nc] = true;
          queue.push([nr, nc]);
          targets.push([nr, nc]);
        }
      }
    }
    
    return targets;
  }

  // Evaluate placement of a ball at target position
  private evaluatePlacement(board: number[][], tr: number, tc: number, color: number) {
    const lineResult = this.evalLineAt(board, tr, tc, color);
    const immediateClearCount = lineResult.clearCells.length;
    
    // Calculate mobility (number of adjacent empty cells)
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let mobility = 0;
    for (const [dr, dc] of dirs) {
      const nr = tr + dr;
      const nc = tc + dc;
      if (this.inBoard(nr, nc) && board[nr][nc] === 0) {
        mobility++;
      }
    }
    
    // Bonus for extending existing lines of same color
    const bonusByColor = lineResult.maxLen >= 4 ? 2 : (lineResult.maxLen === 3 ? 1 : 0);
    
    return {
      immediateClearCount,
      longestRun: lineResult.maxLen,
      openEnds: lineResult.maxOpen,
      mobility,
      bonusByColor
    };
  }

  // Evaluate line formation at specific position
  private evalLineAt(board: number[][], r: number, c: number, color: number) {
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]]; // horizontal, vertical, diagonal \, diagonal /
    let maxLen = 1;
    let maxOpen = 0;
    let clearCells: [number, number][] = [];
    
    for (const [dr, dc] of dirs) {
      const cells: [number, number][] = [[r, c]];
      
      // Forward direction
      let rr = r + dr, cc = c + dc;
      while (this.inBoard(rr, cc) && board[rr][cc] === color) {
        cells.push([rr, cc]);
        rr += dr;
        cc += dc;
      }
      const end1Open = (this.inBoard(rr, cc) && board[rr][cc] === 0) ? 1 : 0;
      
      // Backward direction
      rr = r - dr;
      cc = c - dc;
      while (this.inBoard(rr, cc) && board[rr][cc] === color) {
        cells.push([rr, cc]);
        rr -= dr;
        cc -= dc;
      }
      const end2Open = (this.inBoard(rr, cc) && board[rr][cc] === 0) ? 1 : 0;
      
      if (cells.length > maxLen) {
        maxLen = cells.length;
        maxOpen = end1Open + end2Open;
      } else if (cells.length === maxLen) {
        const open = end1Open + end2Open;
        if (open > maxOpen) maxOpen = open;
      }
      
      if (cells.length >= this.LINE_LENGTH) {
        clearCells = cells;
      }
    }
    
    return { maxLen, maxOpen, clearCells };
  }

  // Center bias - prefer moves closer to center
  private centerBias(tr: number, tc: number): number {
    const cr = (this.ROWS - 1) / 2;
    const cc = (this.COLS - 1) / 2;
    const dist = Math.abs(tr - cr) + Math.abs(tc - cc);
    return -dist * 0.1; // Small penalty for being far from center
  }

  // Compare two candidates and return the better one
  private betterCandidate(a: any, b: any): any {
    if (!a) return b;
    if (b.score !== a.score) return (b.score > a.score) ? b : a;
    
    // Tie-breaking rules
    if (b.stats.immediateClearCount !== a.stats.immediateClearCount) {
      return (b.stats.immediateClearCount > a.stats.immediateClearCount) ? b : a;
    }
    if (b.stats.longestRun !== a.stats.longestRun) {
      return (b.stats.longestRun > a.stats.longestRun) ? b : a;
    }
    if (b.stats.openEnds !== a.stats.openEnds) {
      return (b.stats.openEnds > a.stats.openEnds) ? b : a;
    }
    
    return a; // Keep first candidate if still tied
  }

  private checkCaroWinner(board: number[][], row: number, col: number): number {
    const player = board[row][col];
    const WIN_LENGTH = 5;
    
    // Check horizontal
    let count = 1;
    for (let i = col - 1; i >= 0 && board[row][i] === player; i--) count++;
    for (let i = col + 1; i < 15 && board[row][i] === player; i++) count++;
    if (count >= WIN_LENGTH) return player;

    // Check vertical
    count = 1;
    for (let i = row - 1; i >= 0 && board[i][col] === player; i--) count++;
    for (let i = row + 1; i < 15 && board[i][col] === player; i++) count++;
    if (count >= WIN_LENGTH) return player;

    // Check diagonal (top-left to bottom-right)
    count = 1;
    for (let i = 1; row - i >= 0 && col - i >= 0 && board[row - i][col - i] === player; i++) count++;
    for (let i = 1; row + i < 15 && col + i < 15 && board[row + i][col + i] === player; i++) count++;
    if (count >= WIN_LENGTH) return player;

    // Check diagonal (top-right to bottom-left)
    count = 1;
    for (let i = 1; row - i >= 0 && col + i < 15 && board[row - i][col + i] === player; i++) count++;
    for (let i = 1; row + i < 15 && col - i >= 0 && board[row + i][col - i] === player; i++) count++;
    if (count >= WIN_LENGTH) return player;

    return 0;
  }

  private isCaroBoardFull(board: number[][]): boolean {
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        if (board[row][col] === 0) {
          return false;
        }
      }
    }
    return true;
  }
}
