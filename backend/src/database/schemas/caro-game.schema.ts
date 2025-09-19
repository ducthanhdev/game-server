import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CaroGameDocument = CaroGame & Document;

@Schema({ timestamps: true })
export class CaroGame {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  player1Id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  player2Id: Types.ObjectId;

  @Prop({ 
    required: true,
    type: [[Number]]
  })
  board: number[][];

  @Prop({ required: true, default: 1 })
  currentPlayer: number;

  @Prop({ required: true, default: false })
  isGameOver: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  winnerId: Types.ObjectId;

  @Prop({
    type: [{
      x: Number,
      y: Number,
      playerId: { type: Types.ObjectId, ref: 'User' },
      timestamp: Date
    }]
  })
  moves: Array<{
    x: number;
    y: number;
    playerId: Types.ObjectId;
    timestamp: Date;
  }>;
}

export const CaroGameSchema = SchemaFactory.createForClass(CaroGame);
