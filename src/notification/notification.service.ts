import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { NotificationDocument, Notification } from '../schema/notification.schema';
import { FirebaseSendError, InvalidNotificationInputError, NotificationSaveError } from 'src/errors/notification.error';

@Injectable()
export class NotificationService {
    constructor(@InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>){
        const serviceAccount = require('/home/user/Assignment/social_media/Notification/firebase.json');

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        }
    }

    generateNotificationMessage(userId: string, action: string, postId?: string , fromUser?: string, parentCommentId?: string, replyToUserId?: string): string {
      switch (action) {
        case 'comment':
          return `${fromUser ?? 'Someone'} commented on this post: ${postId}`;
        case 'like':
          return `${fromUser ?? 'Someone'} liked this post ${postId}`;
        case 'reply':
          return `${fromUser ?? 'Someone'} replied on this comment $${parentCommentId}}`; 
        default:
          return 'You have a new notification.';
      }
    }
    async sendNotification(userId: string, action: string, postId?: string, fromUser?: string, parentCommentId?: string, replyToUserId?: string): Promise<void> {


      const messageText = this.generateNotificationMessage(userId, action, postId, fromUser, parentCommentId, replyToUserId);
      console.log("Message text done");
      
      const message = this.buildNotificationMessage(userId, messageText);

      console.log("buildnotification message done");

  
      try {
        const res = await admin.messaging().send(message);
        // console.log(res);
        console.log(`Notification sent:`, res);
      } 
      catch (err) {
        console.error(`Failed to send notification to user ${userId}:`, err);
        throw new FirebaseSendError(err.message);
      }
    }
    
    private buildNotificationMessage(token: string, messageText: string) {
      return {
        token,
        notification: {
          title: 'New Notification',
          body: messageText,
        },
      };
    }

    async createNotification(data: {
      type: string;
      content: string;
      data?: any;
      toToken: string;
      fromUser: string;
    }): Promise<void> {
        try {
            if (!data.type || !data.content || !data.toToken) {
              throw new InvalidNotificationInputError('Missing required fields.');
            }

            // Save notification to database
            const notification = new this.notificationModel({
                type: data.type,
                content: data.content,
                data: data.data,
                toToken: data.toToken,
                fromUser: data.fromUser,
                createdAt: new Date()
            });
            await notification.save();
            
            console.log('Notification saved:', notification);
        } catch (error) {
            console.error('Error creating notification:', error);
            throw new NotificationSaveError(error.message);
        }
    }

}
