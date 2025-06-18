import { Body, Controller, Post } from '@nestjs/common';
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
  @Post('/admin/global')
  sendGlobal(@Body() body: SendGlobalNotificationRequest) {
    return this.adminNotifyService.sendGlobalNotification(body);
  }

  @GrpcMethod('notificationService', 'sendUserNotification')
  @Post('/admin/user')
  sendUser(@Body() body: SendUserNotification) {
    return this.adminNotifyService.sendUserNotification(body);
  }
}
