import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CaroGameDocument = CaroGame & Document;

@Schema({ timestamps: true })
export class CaroGame {
  @Prop({ type: String })
  player1Id: string;

  @Prop({ type: String })
  player2Id: string;

  @Prop({ required: true, type: Object })
  board: any;

  @Prop({ default: 1 })
  currentPlayer: number;

  @Prop({ type: String })
  winnerId: string;

  @Prop({ default: false })
  isGameOver: boolean;
}

export const CaroGameSchema = SchemaFactory.createForClass(CaroGame);
