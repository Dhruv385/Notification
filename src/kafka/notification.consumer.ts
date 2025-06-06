import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationService } from '../notification/notification.service';

@Controller()
export class NotificationConsumer {
  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern('post.reacted')
  async handleKafkaNotification(@Payload() message: any) {
    // const data = message.value;

    // const type = data.type; 
    // const toToken = data.toToken;
    // const fromUser = data.fromUser;
    // const postTitle = data.postTitle;

    // await this.notificationService.sendNotification(toToken, type, fromUser, postTitle);
    console.log(message.userId);
  }
}