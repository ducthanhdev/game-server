import { Module } from '@nestjs/common';
import { Line98Module } from './line98/line98.module';
import { CaroModule } from './caro/caro.module';

@Module({
  imports: [Line98Module, CaroModule],
})
export class GamesModule {}
