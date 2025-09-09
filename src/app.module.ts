import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GamesModule } from './games/games.module';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    GamesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
