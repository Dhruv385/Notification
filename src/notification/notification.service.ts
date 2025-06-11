import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { NotificationResponse, SendGlobalNotificationRequest, SendUserNotification } from 'src/stubs/notify';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { NotificationDocument, Notification } from './notification.schema';
import { CreateUserRequest, FollowRequest, UserResponse } from 'src/stubs/user';
import { CreatePostNotificationRequest, DeletePostNotificationRequest, PostNotificationResponse} from 'src/stubs/post';

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

    async sendTokenToBackend(token: string): Promise<string | null> {
      try {
        const response = await fetch('/api/register-device', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: 'user123', 
            deviceToken: token
          })
        });
        const data = await response.json();
        console.log('Device token registered:', data);
        // You can return the token or some success indicator here
        return token!; // or return null if you want to indicate failure
      } catch (err) {
        console.error('Error registering device token:', err);
        return null; // indicate failure
      }
    }

    generateNotificationMessage(action: string, postId?: string , fromUser?: string, parentCommentId?: string): string {
      switch (action) {
        case 'comment':
          return `${fromUser ?? 'Someone'} commented on this post: ${postId}`;
        case 'like':
          return `${fromUser ?? 'Someone'} liked this post ${postId}`;
        case 'reply':
          return `${fromUser ?? 'Someone'} replied on this comment $${parentCommentId}}`;
        case 'post':
          return `${fromUser} created a new post: ${postId}`;
        default:
          return 'You have a new notification.';
      }
    }
    async sendNotification(token: string, action: string, postId?: string, fromUser?: string, parentCommentId?: string): Promise<void> {
      const messageText = this.generateNotificationMessage(action, postId, fromUser, parentCommentId);
      const message = this.buildNotificationMessage(token, messageText);
  
      try {
        const res = await admin.messaging().send(message);
        console.log(`Notification sent:`, res);
      } 
      catch (err) {
        console.error(`Failed to send notification to user ${token}:`, err);
        throw err;
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
            fromUser: data.userId,
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
    async CreatePostNotification(data: CreatePostNotificationRequest): Promise<PostNotificationResponse> {
      console.log(data);
      try{
        console.log(data);
        const { userId, type, postId, message, friendUserIds } = data;
        const friends = friendUserIds;
        
        if (!friendUserIds) {
          throw new Error('friendUserIds is missing or empty');
        }
        console.log(data);
        for (const friendId of friends) {
          const deviceToken = await this.sendTokenToBackend(friendId);
          if (!deviceToken) {
            console.warn(`No device token found for user ID: ${friendId}`);
            continue; 
          }
          const notifMessage = this.generateNotificationMessage('post', postId, userId);
          console.log(`Sending notification to token: ${deviceToken} with message: ${notifMessage}`);
          await this.sendNotification(deviceToken, notifMessage);
        }
        return { message: 'Notifications sent to friends', success: true };
      }
      catch(err){
        throw new Error('Notification not sent',err);
      }
    }


    async DeletePostNotification(data: DeletePostNotificationRequest): Promise<PostNotificationResponse>{
      try{
        const { postId, userId } = data;
        const messageText = `Post ${postId} has been deleted.`;
        await this.sendNotification(userId, messageText);
        return { message: 'Post deletion notifications sent', success: true };
      }
      catch(err){
        throw new Error('Notification not sent',err);
      }
    }
}
