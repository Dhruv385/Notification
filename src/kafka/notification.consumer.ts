import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class NotificationConsumer implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(private readonly notificationService: NotificationService) {
    this.kafka = new Kafka({
      clientId: 'notification-service',
      brokers: ['localhost:9092'],
    });

    this.consumer = this.kafka.consumer({
      groupId: 'notification-consumer',
      
    });
  }

  async onModuleInit() {
    console.log('Kafka consumer initializing...');

    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'post.react', fromBeginning: true });
    await this.consumer.subscribe({ topic: 'post.comment', fromBeginning: true });
    await this.consumer.subscribe({ topic: 'post.reply', fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const value = message.value?.toString();
        const data = value ? JSON.parse(value) : {};

        console.log(`Received message on topic ${topic}:`, data);

        try {
          switch (topic) {
            case 'post.react': {
              const { postId, userId, postOwnerId } = data;
              await this.notificationService.sendNotification(
                userId,
                'like',
                postId,
                postOwnerId
              );
              break;
            }

            case 'post.comment': {
              const { postId, userId, postOwnerId } = data;
              await this.notificationService.sendNotification(
                userId,
                'comment',
                postId,
                postOwnerId
              );
              break;
            }

            case 'post.reply': {
              const { postId, userId, postOwnerId, parentCommentId, replyToUserId } = data;
              await this.notificationService.sendNotification(
                userId,
                'reply',
                postId,
                postOwnerId,
                parentCommentId,
                replyToUserId
              );
              break;
            }

            default:
              console.warn('Unhandled topic:', topic);
          }
        } catch (err) {
          console.error(`Error handling message from ${topic}:`, err);
        }
      },
    });

    console.log('Kafka consumer is running and listening to topics.');
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
    console.log('Kafka consumer disconnected');
  }
}
