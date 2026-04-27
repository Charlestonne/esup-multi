import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Like extends Document {
  @Prop({ required: true })
  eventId: string;

  @Prop({ required: true })
  username: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const LikeSchema = SchemaFactory.createForClass(Like);
LikeSchema.index({ eventId: 1, username: 1 }, { unique: true });
