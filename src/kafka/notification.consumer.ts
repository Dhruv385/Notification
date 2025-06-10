import { Controller, OnModuleInit } from '@nestjs/common';
import { NotificationService } from '../notification/notification.service';
import { Kafka } from 'kafkajs';
import { buildNotificationMessage } from 'utilis/notification.utilis';
import * as admin from 'firebase-admin';

@Controller()
export class NotificationConsumer implements OnModuleInit {
  private kafka: Kafka;
  private consumer: any;

  constructor(
    private readonly notificationService: NotificationService,
  ) {
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

  async onModuleInit() {
    console.log('Starting Kafka consumer.');
    
    try {
      await this.consumer.connect();
      console.log('Connected to Kafka');

      await this.consumer.subscribe({ topic: 'post', fromBeginning: true });
      console.log('Subscribed to "post" topic');

      // await this.consumer.run({
      //   autoCommit: false,
      //   eachMessage: async ({ topic, partition, message }) => {
      //     console.log('Received message:', {
      //       topic,
      //       partition,
      //       offset: message.offset,
      //       value: message.value.toString(),
      //     });

      //     try {
      //       const messageData = JSON.parse(message.value.toString());
      //       console.log('Parsed message:', messageData);

      //       const { postId, userId, postOwnerId } = messageData;

      //       if (!postId || !userId || !postOwnerId) {
      //         throw new Error('Missing required fields in message');
      //       }

      //       // Create notification with required fields
      //       await this.notificationService.createNotification({
      //         type: 'REACTION',
      //         content: `User ${userId} reacted to your post ${postId}`,
      //         data: { postId, userId },
      //         toToken: postOwnerId,
      //         fromUser: userId
      //       });

      //       console.log('Notification processed successfully');
      //     } catch (error) {
      //       console.error('Error processing message:', error);
      //     }
      //   },
      // });

      await this.consumer.run({
        autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {
          console.log('Received message:', {
            topic,
            partition,
            offset: message.offset,
            value: message.value.toString(),
          });
      
          try {
            const messageData = JSON.parse(message.value.toString());
            const { postId, userId, postOwnerId, type, postTitle } = messageData;
      
            if (!postId || !userId || !postOwnerId || !type) {
              throw new Error('Missing required fields in message');
            }
            const notification = buildNotificationMessage(type, {
              toToken: postOwnerId,
              fromUser: userId,
              postTitle,
            });
      
            await admin.messaging().send(notification);
            await this.notificationService.createNotification({
              type: type.toUpperCase(), // e.g., "LIKE" or "COMMENT"
              content: `User ${userId} ${type}ed your post ${postId}`,
              data: { postId, userId },
              toToken: postOwnerId,
              fromUser: userId,
            });
      
            console.log('Notification processed successfully');
          } 
          catch (err) {
            console.error('Error processing message:', err);
          }
        },
      });

      console.log('Consumer is running');
    } catch (error) {
      console.error('Error starting consumer:', error);
      throw error;
    }
  }
}