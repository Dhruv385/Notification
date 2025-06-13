// user-session.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class UserSession extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  refreshToken: string;

  @Prop()
  deviceId?: string;

  @Prop({ default: 'active' })
  status: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop({required: true})
  fcmToken?: string;
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);
