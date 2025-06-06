import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { buildNotificationMessage } from '../../utilis/notification.utilis';
import { NotificationResponse, SendGlobalNotificationRequest, SendUserNotification } from 'src/stubs/notify';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { NotificationDocument, Notification } from './notification.schema';
import { CreateUserRequest, UserResponse } from 'src/stubs/user';
import { CreatePostRequest, DeletePostRequest, PostResponse } from 'src/stubs/post';

@Injectable()
export class NotificationService {
    constructor(@InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>){
        const serviceAccount = require('/home/user/Assignment/task/src/notification/firebase_key.json');

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        }
    }

    // async saveToDatabase(type: string, token: string, fromUser: string, postTitle?: string) {
    //   const doc = new this.notificationModel({ type, toToken: token, fromUser, postTitle });
    //   await doc.save();
    // }

    async sendNotification(token: string, action: string, fromUser?: string, postTitle?: string): Promise<void> {
      const notifications = [
        buildNotificationMessage(action as any, {
          toToken: token,
          fromUser: fromUser ?? 'Unknown',
          postTitle: postTitle,
        }),
      ];
    
      for (const message of notifications) {
        try {
          const res = await admin.messaging().send(message);
          console.log(`${message.notification?.title} sent:`, res);
        } catch (err) {
          console.error(`Error sending ${message.notification?.title}:`, err);
        }
      }
    }


    // Admin Service
    async sendGlobalNotification(data: SendGlobalNotificationRequest): Promise<NotificationResponse>{
      console.log(data);
      return {
        message: 'Global notification sent successfully',
        success: true,
      };
    }

    async sendUserNotification(data: SendUserNotification): Promise<NotificationResponse>{
      console.log(data);
      return {
        message: `User notification sent successfully to ${data.userId}`,
        success: true,
      }
    }


    // User Service
    async create(data: CreateUserRequest): Promise<UserResponse> {
      console.log(data);
      return {
        message: `User Created successfully ${data.fullName}`,
        status: 'true',
      }
    }


    // Post Service
    async createPost(data: CreatePostRequest): Promise<PostResponse> {
      console.log(data);
      return {
        message: `Post Created Successfully ${data.postOwnerId}`,
        success: true,
      }
    }

    async DeletePost(data: DeletePostRequest): Promise<PostResponse> {
      console.log(data);
      return {
        message: `Post Deleted Successfully ${data.postOwnerId}`,
        success: true,
      }
    }
}
