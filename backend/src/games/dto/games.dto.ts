import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class MakeLine98MoveDto {
  @IsNumber()
  @Min(0)
  @Max(8)
  fromRow: number;

  @IsNumber()
  @Min(0)
  @Max(8)
  fromCol: number;

  @IsNumber()
  @Min(0)
  @Max(8)
  toRow: number;

  @IsNumber()
  @Min(0)
  @Max(8)
  toCol: number;
}

export class JoinCaroGameDto {
  @IsString()
  gameId: string;

  @IsString()
  @IsOptional()
  opponentId?: string;
}

export class MakeCaroMoveDto {
  @IsNumber()
  @Min(0)
  @Max(14)
  x: number;

  @IsNumber()
  @Min(0)
  @Max(14)
  y: number;
}
