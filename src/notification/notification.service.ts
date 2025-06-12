import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { NotificationResponse, SendGlobalNotificationRequest, SendUserNotification } from 'src/stubs/notify';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { NotificationDocument, Notification } from './notification.schema';
import { CreateUserRequest, FollowRequest, UserResponse } from 'src/stubs/user';
import { TagNotificationRequest, TagNotificationResponse } from 'src/stubs/post';

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

    generateNotificationMessage(userId: string, action: string, postId?: string , fromUser?: string, parentCommentId?: string, replyToUserId?: string): string {
      switch (action) {
        case 'comment':
          return `${fromUser ?? 'Someone'} commented on this post: ${postId}`;
        case 'like':
          return `${fromUser ?? 'Someone'} liked this post ${postId}`;
        case 'reply':
          return `${fromUser ?? 'Someone'} replied on this comment $${parentCommentId}}`;
        case 'post':
          return `${fromUser} created a new post: ${postId}`;
        case 'banned':
          return `${fromUser} banned this account ${userId}`;
        case 'unbanned':
          return `${fromUser} unbanned this account ${userId}`
        case 'mention':
          return `${fromUser} mention this account ${userId}`  
        default:
          return 'You have a new notification.';
      }
    }
    async sendNotification(token: string, action: string, postId?: string, fromUser?: string, parentCommentId?: string, replyToUserId?: string): Promise<void> {
      const messageText = this.generateNotificationMessage(token, action, postId, fromUser, parentCommentId, replyToUserId);

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
    
    private async sendFCMNotification(token: string, title: string, body: string) {
      const message = {
        token,
        notification: { title, body },
      };
    
      try {
        const res = await admin.messaging().send(message);
        console.log(`✅ Notification sent to ${token}:`, res);
      } catch (err) {
        console.error(`❌ Failed to send to ${token}:`, err);
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

      try {
        // Fetch all user tokens from your user DB or session DB
        const users = await this.notificationModel.find({}); // todo 1- add databse name here
    
        const tokens = users.map((user) => user.toToken).filter(Boolean);
    
        if (!tokens.length) {
          return {
            message: 'No users found to send notifications',
            success: false,
          };
        }
    
        // Send FCM notification to all users in parallel
        await Promise.all(
          tokens.map(async (token) => {
            await this.sendFCMNotification(token, data.title, data.body);
            await this.createNotification({
              type: data.title,
              content: data.body,
              fromUser: data.sender,
              toToken: token,
              data: null,
            });
          })
        );
    
        return {
          message: 'Global notification sent successfully to all users',
          success: true,
        };
      } catch (err) {
        console.error('Global notification error:', err);
        return {
          message: 'Failed to send global notification',
          success: false,
        };
      }
    }

    async sendUserNotification(data: SendUserNotification): Promise<NotificationResponse>{
      console.log(data);
      try {
        // Fetch user token from your user DB or session DB
        const user = await this.notificationModel.find({}); // todo 2- add databse name here
        //@ts-ignore          
        const tokens = user.token;
    
        if (!tokens) {
          return {
            message: 'No users found to send notifications',
            success: false,
          };
        }
    
        // Send FCM notification to all users in parallel
        await this.sendFCMNotification(tokens, data.title, data.body);
        await this.createNotification({
            type: data.title,
            content: data.body,
            fromUser: data.sender,
            toToken: tokens,
            data: null,
        });
        return {
          message: 'User notification sent successfully users',
          success: true,
        };
      } 
      catch (err) {
        console.error('User notification error:', err);
        return {
          message: 'Failed to send user notification',
          success: false,
        };
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
        const user = await this.notificationModel.find({}); // todo 3- add databse name here (remove the ts ignore)
        //@ts-ignore          
        const token = user.token;
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
        const user = await this.notificationModel.find({}); // todo 4- add databse name here
        //@ts-ignore
        const token = user.token;
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


    async mentionNotification(data: TagNotificationRequest): Promise<TagNotificationResponse> {
      try {
        // Step 1: Fetch tokens of tagged users
        const users = await this.notificationModel.find({
          userId: { $in: data.TagedUserIds },
        });
    
        const tokens = users.map((user) => user.toToken).filter(Boolean);
    
        // Step 2: Send and Save Notification to each tagged user
        await Promise.all(
          tokens.map(async (token, index) => {
            const taggedUserId = data.TagedUserIds[index];
    
            const message = `${data.userId} tagged you in a post: ${data.postId}`;
    
            await this.sendNotification(token, 'mention', data.postId, data.userId);
    
            await this.createNotification({
              type: 'mention',
              content: message,
              fromUser: data.userId,
              toToken: token,
              data: { postId: data.postId },
            });
          })
        );
    
        return {
          message: 'Mention notifications sent successfully',
          success: true,
        };
      } catch (error) {
        console.error('Error in mentionNotification:', error);
        return {
          message: 'Failed to send mention notifications',
          success: false,
        };
      }
    }
    
    
}
