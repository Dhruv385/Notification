import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserSession, UserSessionSchema } from "src/schema/user-session.schema";
import { NotificationSchema, Notification } from "../../schema/notification.schema";
import { AdminNotifyService } from "./adminNotify.service";
import { AdminNotifyController } from "./adminNotify.controller";


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]),
    MongooseModule.forFeature([
      { name: UserSession.name, schema: UserSessionSchema, collection: 'usersessions' }
    ]),
  ],
  providers: [AdminNotifyService],
  controllers: [AdminNotifyController]
})

export class AdminNotifyModule {}