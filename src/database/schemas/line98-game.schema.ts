import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type Line98GameDocument = Line98Game & Document;

@Schema({ timestamps: true })
export class Line98Game {
  @Prop({ required: true, type: String })
  playerId: string;

  @Prop({ required: true, type: Object })
  gameState: any;

  @Prop({ default: 0 })
  score: number;

  @Prop({ default: false })
  isGameOver: boolean;
}

export const Line98GameSchema = SchemaFactory.createForClass(Line98Game);
