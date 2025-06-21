import { Body, Controller } from '@nestjs/common';
import { AdminNotifyService } from './adminNotify.service';
import { GrpcMethod } from '@nestjs/microservices';
import {
  SendGlobalNotificationRequest,
  SendUserNotification,
} from 'src/stubs/admin';


@Controller('/notify')
export class AdminNotifyController {
  constructor(private readonly adminNotifyService: AdminNotifyService) {}

  @GrpcMethod('notificationService', 'sendGlobalNotification')
  sendGlobal(@Body() body: SendGlobalNotificationRequest) {
    return this.adminNotifyService.sendGlobalNotification(body);
  }

  @GrpcMethod('notificationService', 'sendUserNotification')
  sendUser(@Body() body: SendUserNotification) {
    return this.adminNotifyService.sendUserNotification(body);
  }
}
