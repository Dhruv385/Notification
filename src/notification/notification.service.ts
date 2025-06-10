import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { buildNotificationMessage } from '../../utilis/notification.utilis';
import { NotificationResponse, SendGlobalNotificationRequest, SendUserNotification } from 'src/stubs/notify';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { NotificationDocument, Notification } from './notification.schema';
import { CreateUserRequest, FollowRequest, UserResponse } from 'src/stubs/user';
import { SendPostNotificationRequest, SendPostNotificationResponse } from 'src/stubs/post';

@Injectable()
export class NotificationService {
    constructor(@InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>){
        const serviceAccount = require('/home/user/Assignment/Notification/firebase.json');

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        }
    }

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

    async createNotification(data: {
      type: string;
      content: string;
      data?: any;
      toToken: string;
      fromUser: string;
    }): Promise<void> {
        try {
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
            throw error;
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
      if (!data.userId) {
        return {
          message: `User not Created`,
          status: 'false',
        };
      }
      try{
        const token = data['token']; 
      
        if (token) {
          await this.sendNotification(token, 'create', data.userId);
          await this.createNotification({
            type: 'create',
            content: `Welcome ${data.userId}!`,
            fromUser: 'System',
            toToken: token,
            data: null,
          });
        }
        return {
          message: `User Created successfully ${data.userId}`,
          status: 'true',
        };
      }
      catch(err){
        console.error('Error while sending post notifications:', err);
        return { message: 'Something went wrong', status: 'false' };
      }
    }

    async follow(data: FollowRequest): Promise<UserResponse> {
      console.log(data);
      if (!data.userId || !data.targetId) {
        return {
          message: `Invalid follow request: missing userId or targetId`,
          status: 'false',
        };
      }
    
      try{
        const token = data['token']; 
      
        if (token) {
          await this.sendNotification(token, 'follow', data.userId);
          await this.createNotification({
            type: 'follow',
            content: `${data.userId} followed you`,
            fromUser: data.userId,
            toToken: token,
            data: { targetId: data.targetId },
          });
        }
      
        return {
          message: `${data.userId} started following ${data.targetId}`,
          status: 'true',
        };
      }
      catch(err){
        console.error('Error while sending post notifications:', err);
        return { message: 'Something went wrong', status: 'false' };
      }
    }


    // Post Service
    async sendPostNotification(data: SendPostNotificationRequest): Promise<SendPostNotificationResponse> {
      console.log(data);
      if(!data.userId || !data.post){
        console.warn('Invalid request or no friends found');
        return { success: false };
      }

      try{
        const { type, title, message, post } = data;
        const friends = Object.entries(post); // [ [friendId1, token1], [friendId2, token2], ... ]
        for (const [friendId, token] of friends) {
          console.log(`Notifying ${friendId}`);
          await this.sendNotification(token, type, data.userId, title);
          await this.createNotification({
            type,
            content: message,
            toToken: token,
            fromUser: data.userId,
            data: { friendId, postTitle: title },
          });
        }
        return { success: true };
      } 
      catch (err){
        console.error('Error while sending post notifications:', err);
        return { success: false };
      }
    }
}
