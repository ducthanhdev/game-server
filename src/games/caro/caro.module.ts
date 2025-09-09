import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CaroService } from './caro.service';
import { CaroGateway } from './caro.gateway';
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
  providers: [CaroService, CaroGateway, JwtService],
})
export class CaroModule {}
