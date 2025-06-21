import { Body, Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { TagNotificationRequest } from 'src/stubs/post';
import { PostNotifyService } from './postNotify.service';


@Controller('/notify')
export class PostNotifyController {
  constructor(private readonly postNotifyService: PostNotifyService) {}

  @GrpcMethod('NotificationService', 'TagNotification')
  tagNotification(@Body() body: TagNotificationRequest) {
    console.log('gRPC tagNotification called with:', body);
    return this.postNotifyService.mentionNotification(body);
  }
}
