import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CaroService } from './caro.service';
import { CaroGame, CaroGameSchema } from '../../database/schemas/caro-game.schema';
import { User, UserSchema } from '../../database/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CaroGame.name, schema: CaroGameSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [CaroService, JwtService],
  exports: [CaroService],
})
export class CaroModule {}
