import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Line98Service } from './line98.service';
import { Line98Gateway } from './line98.gateway';
import { Line98Game, Line98GameSchema } from '../../database/schemas/line98-game.schema';
import { User, UserSchema } from '../../database/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Line98Game.name, schema: Line98GameSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [Line98Service, Line98Gateway, JwtService],
})
export class Line98Module {}
