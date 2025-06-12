import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { Kafka } from 'kafkajs';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class NotificationConsumer implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: any;

  constructor(private readonly notificationService: NotificationService) {
        this.kafka = new Kafka({
          clientId: 'notification-service',
          brokers: ['localhost:9092'],
        });
        this.consumer = this.kafka.consumer({ 
          groupId: 'notification-consumer',
          allowAutoTopicCreation: true,
          sessionTimeout: 30000,
          heartbeatInterval: 3000,
          maxWaitTimeInMs: 5000,
        });
      }
  onModuleInit() {
    console.log('Kafka consumer initialized');
  }

  async onModuleDestroy() {
    console.log('Kafka consumer destroyed');
  }

  @MessagePattern('post.react')
  async handleReaction(@Payload() data: any, @Ctx() context: KafkaContext) {
    try{
      const message = context.getMessage();
      const offset = message.offset;
      console.log('Received like event:', data);
      const { postId, commenterId, postOwnerId} = data;

      await this.notificationService.sendNotification(
        postOwnerId,
        'Like',
        postId,
        '',
        commenterId,
        
      );
    }
    catch(err){
      throw new Error('Something went wrong',err);
    }
  }

  @MessagePattern('post.comment')
  async handleComment(@Payload() data: any, @Ctx() context: KafkaContext) {
    try{
      const message = context.getMessage();
      const offset = message.offset;
      console.log('Received comment event:', data);
      const { postId, commenterId, postOwnerId} = data;

      await this.notificationService.sendNotification(
        postOwnerId,
        'comment',
        postId,
        '',
        commenterId,
      );
    }
    catch(err){
      throw new Error('Something went wrong',err);
    }
  }

  @MessagePattern('post.reply')
  async handleReply(@Payload() data: any, @Ctx() context: KafkaContext) {
    try{
      const message = context.getMessage();
      const offset = message.offset;
      console.log('Received reply event:', data);
      const { userId, postId, parentCommentId, replyToUserId} = data;
      await this.notificationService.sendNotification(
        userId,
        'Reply',
        postId,
        '',
        '',
        replyToUserId
      )
    }
    catch(err){
      throw new Error('Something went wrong', err);
    }
  }
}