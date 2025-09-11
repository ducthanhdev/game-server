import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CaroMatchDocument = CaroMatch & Document;

@Schema({ timestamps: true, versionKey: false })
export class CaroMatch {
  @Prop({ required: true })
  roomId: string;

  @Prop({ required: true })
  xUserId: string;

  @Prop({ required: true })
  oUserId: string;

  @Prop({ default: 15 })
  size: number; // 15x15

  @Prop({ 
    type: [{ 
      x: { type: Number, required: true }, 
      y: { type: Number, required: true }, 
      by: { type: String, required: true }, 
      t: { type: Number, required: true } 
    }], 
    default: [] 
  })
  moves: Array<{ x: number; y: number; by: string; t: number }>;

  @Prop()
  winnerUserId?: string;

  @Prop()
  winnerSymbol?: 'X' | 'O';

  @Prop({ default: 'ended' })
  status: 'playing' | 'ended';

  @Prop()
  endedAt?: Date;
}

export const CaroMatchSchema = SchemaFactory.createForClass(CaroMatch);
