import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true })
  recieverId: string;

  @Prop({required: false})
  senderName?: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  content: string;

  @Prop({required: false})
  senderId?: string;

  @Prop({required: false})
  postId?: string;

  @Prop({required: false})
  posturl?: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
