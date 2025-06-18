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
    await this.consumer.subscribe({
      topic: 'post.comment',
      fromBeginning: true,
    });
    await this.consumer.subscribe({ topic: 'post.reply', fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const value = message.value?.toString();
        const data = value ? JSON.parse(value) : {};

        console.log(`Received message on topic ${topic}:`, data);

        try {
          switch (topic) {
            case 'post.react': {
              const { postId, userId, username, postOwnerId } = data;
              await this.notificationService.sendNotification(
                postOwnerId,
                'like',
                postId,
                userId,
                username,
              );
              break;
            }

            case 'post.comment': {
              const { postId, userId, username, postOwnerId } = data;
              await this.notificationService.sendNotification(
                postOwnerId,
                'comment',
                postId,
                userId,
                username,
              );
              break;
            }

            case 'post.reply': {
              const {
                postId,
                userId,
                username,
                parentCommentId,
                replyToUserId,
              } = data;
              await this.notificationService.sendNotification(
                replyToUserId,
                'reply',
                postId,
                userId,
                username,
                parentCommentId,
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
