import { IsString, IsNumber, Min, Max } from 'class-validator';

export class MakeMoveDto {
  @IsString()
  roomId: string;

  @IsNumber()
  @Min(0)
  @Max(14)
  x: number;

  @IsNumber()
  @Min(0)
  @Max(14)
  y: number;
}
