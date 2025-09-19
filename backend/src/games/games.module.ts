import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { Line98Gateway } from './gateway/line98.gateway';
import { CaroGateway } from './gateway/caro.gateway';
import { Line98Game, Line98GameSchema } from '../database/schemas/line98-game.schema';
import { CaroGame, CaroGameSchema } from '../database/schemas/caro-game.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Line98Game.name, schema: Line98GameSchema },
      { name: CaroGame.name, schema: CaroGameSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
    }),
  ],
  controllers: [GamesController],
  providers: [GamesService, Line98Gateway, CaroGateway],
  exports: [GamesService],
})
export class GamesModule {}
