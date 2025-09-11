import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Line98Game, Line98GameSchema } from './schemas/line98-game.schema';
import { CaroGame, CaroGameSchema } from './schemas/caro-game.schema';
import { CaroMatch, CaroMatchSchema } from './schemas/caro-match.schema';
import { databaseConfig } from '../config/database.config';

@Module({
  imports: [
    MongooseModule.forRoot(databaseConfig.uri),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Line98Game.name, schema: Line98GameSchema },
      { name: CaroGame.name, schema: CaroGameSchema },
      { name: CaroMatch.name, schema: CaroMatchSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
