import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true })
  recieverId: string;

  @Prop()
  senderName?: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  senderId?: string;

  @Prop()
  postId?: string;

  @Prop()
  posturl?: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
