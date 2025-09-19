import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type Line98GameDocument = Line98Game & Document;

@Schema({ timestamps: true })
export class Line98Game {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  playerId: Types.ObjectId;

  @Prop({ 
    required: true,
    type: {
      board: [[Number]],
      score: Number,
      isGameOver: Boolean,
      selectedBall: {
        row: Number,
        col: Number
      }
    }
  })
  gameState: {
    board: number[][];
    score: number;
    isGameOver: boolean;
    selectedBall: { row: number; col: number } | null;
  };

  @Prop({ required: true, default: 0 })
  score: number;

  @Prop({ required: true, default: false })
  isGameOver: boolean;

  @Prop({ type: Date })
  lastSavedAt: Date;
}

export const Line98GameSchema = SchemaFactory.createForClass(Line98Game);
