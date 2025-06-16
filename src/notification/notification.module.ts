import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationSchema } from '../schema/notification.schema';
import { MongooseModule } from '@nestjs/mongoose';
import {  Notification } from '../schema/notification.schema';
import { UserSession, UserSessionSchema } from 'src/schema/user-session.schema';
import { GrpcAuthModule } from 'src/guard/grpc-auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]),
    MongooseModule.forFeature([
      { name: UserSession.name, schema: UserSessionSchema, collection: 'usersessions' }
    ]),
    GrpcAuthModule
  ],
  providers: [NotificationService],
  controllers: [NotificationController],
  exports: [NotificationService]
})
export class NotificationModule {}
