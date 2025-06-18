import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSession, UserSessionSchema } from 'src/schema/user-session.schema';
import { PostNotifyService } from './postNotify.service';
import { PostNotifyController } from './postNotify.controller';
import {
  NotificationSchema,
  Notification,
} from 'src/schema/notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    MongooseModule.forFeature([
      {
        name: UserSession.name,
        schema: UserSessionSchema,
        collection: 'usersessions',
      },
    ]),
  ],
  providers: [PostNotifyService],
  controllers: [PostNotifyController],
})
export class PostNotifyModule {}
