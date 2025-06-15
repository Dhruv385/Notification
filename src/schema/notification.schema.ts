import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification{
  @Prop({ required: true })
  type: string;

  @Prop({required: true})
  content: string;

  @Prop({ required: true })
  fromUser: string;

  @Prop()
  postTitle?: string;

  @Prop({ required: true })
  toToken: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
