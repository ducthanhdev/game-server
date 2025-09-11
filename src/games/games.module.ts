import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Line98Module } from './line98/line98.module';
import { CaroModule } from './caro/caro.module';
import { CaroGateway } from './gateway/caro.gateway';
import { CaroService } from './services/caro.service';
import { MatchmakingService } from './services/matchmaking.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    Line98Module, 
    CaroModule, 
    DatabaseModule,
    JwtModule.register({
      secret: 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [CaroGateway, CaroService, MatchmakingService],
  exports: [CaroService, MatchmakingService],
})
export class GamesModule {}
