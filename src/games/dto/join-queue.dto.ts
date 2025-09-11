import { IsOptional } from 'class-validator';

export class JoinQueueDto {
  @IsOptional()
  preferences?: {
    timeLimit?: number;
    boardSize?: number;
  };
}
