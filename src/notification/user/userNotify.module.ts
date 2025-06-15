import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSession, UserSessionSchema } from 'src/schema/user-session.schema';
import { UserNotifyService } from './userNotify.service';
import { UserNotifyController } from './userNotify.controller';
import { NotificationSchema, Notification } from 'src/schema/notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]),
    MongooseModule.forFeature([{ name: UserSession.name, schema: UserSessionSchema, collection: 'usersessions' }])
  ],
  providers: [UserNotifyService],
  controllers: [UserNotifyController]
})
export class UserNotifyModule {}
