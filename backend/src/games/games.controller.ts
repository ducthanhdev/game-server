import { Controller, Post, Get, Put, Delete, Body, UseGuards, Request, Param, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GamesService } from './games.service';
import { MakeLine98MoveDto, MakeCaroMoveDto, JoinCaroGameDto } from './dto/games.dto';

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  // Line 98 Game APIs
  @Post('line98/create')
  async createLine98Game(@Request() req) {
    const userId = req.user?.id || req.user?._id;
    return this.gamesService.createLine98Game(userId);
  }

  @Get('line98/latest')
  async getLatestLine98Game(@Request() req) {
    try {
      const userId = req.user?.id || req.user?._id;
      
      if (!userId) {
        return null;
      }
      
      const game = await this.gamesService.getLatestLine98Game(userId);
      return game;
    } catch (error) {
      return null;
    }
  }

  @Get('line98/:gameId')
  async getLine98Game(@Request() req, @Param('gameId') gameId: string) {
    const userId = req.user?.id || req.user?._id;
    return this.gamesService.getLine98Game(userId, gameId);
  }

  @Put('line98/:gameId/move')
  async makeLine98Move(@Request() req, @Param('gameId') gameId: string, @Body() moveDto: MakeLine98MoveDto) {
    const userId = req.user?.id || req.user?._id;
    return this.gamesService.makeLine98Move(userId, gameId, moveDto);
  }

  @Get('line98/:gameId/hint')
  async getLine98Hint(@Request() req, @Param('gameId') gameId: string) {
    const userId = req.user?.id || req.user?._id;
    return this.gamesService.getLine98Hint(userId, gameId);
  }

  // Caro Game APIs
  @Post('caro/create')
  async createCaroGame(@Request() req) {
    const userId = req.user?.id || req.user?._id;
    return this.gamesService.createCaroGame(userId);
  }

  @Post('caro/join')
  async joinCaroGame(@Request() req, @Body() joinDto: JoinCaroGameDto) {
    const userId = req.user?.id || req.user?._id;
    return this.gamesService.joinCaroGame(userId, { gameId: joinDto.gameId, opponentId: joinDto.opponentId });
  }

  @Get('caro/user/:userId/history')
  async getCaroGameHistory(@Request() req, @Param('userId') userId: string) {
    const currentUserId = req.user?.id || req.user?._id;
    return this.gamesService.getCaroGameHistory(currentUserId, userId);
  }

  @Get('caro/:gameId')
  async getCaroGame(@Request() req, @Param('gameId') gameId: string) {
    const userId = req.user?.id || req.user?._id;
    return this.gamesService.getCaroGame(userId, gameId);
  }

  @Put('caro/:gameId/move')
  async makeCaroMove(@Request() req, @Param('gameId') gameId: string, @Body() moveDto: MakeCaroMoveDto) {
    const userId = req.user?.id || req.user?._id;
    return this.gamesService.makeCaroMove(userId, gameId, moveDto);
  }
}
