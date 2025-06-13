import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { NotificationResponse, SendGlobalNotificationRequest, SendUserNotification } from 'src/stubs/admin';
import mongoose, { Model, Connection, Types } from 'mongoose';
import { InjectConnection, InjectModel, ParseObjectIdPipe } from '@nestjs/mongoose';
import { NotificationDocument, Notification } from './notification.schema';
import { CreateUserRequest, FollowRequest, UserResponse } from 'src/stubs/user';
import { TagNotificationRequest, TagNotificationResponse } from 'src/stubs/post';

import { ObjectId } from 'mongoose';
import { UserSession } from 'src/schema/user-session.schema';

@Injectable()
export class NotificationService {
    constructor(@InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(UserSession.name) private readonly userSessionModel: Model<UserSession>,
    @InjectConnection() private readonly connection: Connection){
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
        case 'post':
          return `${fromUser} created a new post: ${postId}`;
        case 'banned':
          return `${fromUser} banned this account ${userId}`;
        case 'unbanned':
          return `${fromUser} unbanned this account ${userId}`;
        case 'mention':
          return `${fromUser} mention this account ${userId}`;
        case 'create':
          return `${userId} create the account`;
        case 'follow':
          return `${userId} send the following request`;  
        default:
          return 'You have a new notification.';
      }
    }
    async sendNotification(userId: string, action: string, postId?: string, fromUser?: string, parentCommentId?: string, replyToUserId?: string): Promise<void> {


      const messageText = this.generateNotificationMessage(userId, action, postId, fromUser, parentCommentId, replyToUserId);
      console.log("Message text done");
      
      const message = this.buildNotificationMessage(userId, messageText);

      console.log("buildnotification messahe done");

  
      try {
        // const correctId = '6848122613173af6024ef1ea';
       
        // const user = await this.userSessionModel.findOne({
        //   userId: '890e3e805be127abc1234721',
        // });
        
        // console.log(user); 
        console.log(userId);
        const user = await this.userSessionModel.findOne({userId: userId}); // todo 3- add databse name here (remove the ts ignore)  
        console.log(user);         
        console.log(message);
        
        const res = await admin.messaging().send(message);
        console.log(res);
        
        console.log(`Notification sent:`, res);
      } 
      catch (err) {
        console.error(`Failed to send notification to user ${userId}:`, err);
        throw err;
      }
    }
    
    async sendFCMNotification(token: string, title: string, body: string) {
      const message = {
        token,
        notification: { title, body },
      };
    
      try {
        console.log(token);
        const res = await admin.messaging().send(message);
        console.log(`Notification sent to ${token}:`, res);
      } catch (err) {
        console.error(`Failed to send to ${token}:`, err);
      }
    }

    async sendFCMNotificationForAdmin(
      userId: string,
      title: string,
      body: string
    ): Promise<void> {
      try {
        // Fetch user's FCM token from DB if not passed directly (optional)
        const session = await this.userSessionModel.findOne({ userId });
  
        if (!session || !session.fcmToken) {
          console.warn(`No FCM token found for user ${userId}`);
          return;
        }
  
        const message: admin.messaging.Message = {
          token: session.fcmToken,
          notification: {
            title,
            body,
          },
          data: {
            userId,
            // You can add custom data fields here
          },
        };
  
        const response = await admin.messaging().send(message);
        console.log(`FCM sent to user ${userId}:`, response);
      } catch (error) {
        console.error(`Error sending FCM to user ${userId}:`, error);
      }
    }

    private async sendGlobalUserNotification(token: string, title: string, body: string) {
      console.log(token);
      const message = {
        token,
        notification: {
          title,
          body,
        },
      };
    
      try {
        const response = await admin.messaging().send(message);
        console.log(`Global Notification sent to ${token}:`, response);
      } catch (err) {
        console.error(`Failed to send global notification to ${token}:`, err);
      }
    }
  
    private async sendNotificationForCreateUser(token: string, userId: string): Promise<void> {
      if (!token) {
        console.warn('No FCM token provided. Skipping notification.');
        return;
      }
    
      const message = {
        token,
        notification: {
          title: 'Welcome!',
          body: `Welcome ${userId}! Your account has been created.`,
        },
      };
    
      try {
        const response = await admin.messaging().send(message);
        console.log(`Create user notification sent to ${token}:`, response);
      } catch (error) {
        console.error(`Failed to send create user notification to token ${token}:`, error);
        throw error;
      }
    }
    
    private async sendNotificationForFollow(token: string, type: string, fromUser: string): Promise<void> {
      if (!token) {
        console.warn('No FCM token provided. Skipping notification.');
        return;
      }
    
      let title = '';
      let body = '';
    
      switch (type) {
        case 'follow':
          title = 'New Follower';
          body = `${fromUser} started following you`;
          break;
        default:
          title = type;
          body = `${fromUser} triggered ${type} action`;
      }
    
      const message = {
        token,
        notification: {
          title,
          body,
        },
      };
    
      try {
        const response = await admin.messaging().send(message);
        console.log(`Notification (${type}) sent to token ${token}:`, response);
      } catch (error) {
        console.error(`Failed to send ${type} notification to token ${token}:`, error);
        throw error;
      }
    }

    private async sendNotificationForMention(
      token: string,
      type: string,
      postId: string,
      fromUser: string
    ): Promise<void> {
      if (!token) {
        console.warn('No FCM token provided. Skipping notification.');
        return;
      }
    
      let title = '';
      let body = '';
    
      switch (type) {
        case 'mention':
          title = 'You were mentioned!';
          body = `${fromUser} tagged you in a post (${postId})`;
          break;
        default:
          title = type;
          body = `${fromUser} performed ${type} action`;
      }
    
      const message = {
        token,
        notification: {
          title,
          body,
        },
        data: {
          type,
          postId,
          fromUser,
        },
      };
    
      try {
        const response = await admin.messaging().send(message);
        console.log(`Mention notification sent to token ${token}:`, response);
      } catch (error) {
        console.error(`Failed to send mention notification to ${token}:`, error);
        throw error;
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
    async sendGlobalNotification(data: SendGlobalNotificationRequest): Promise<NotificationResponse> {
      try {
        // Fetch all users with FCM tokens
        const users = await this.userSessionModel.find({ fcmToken: { $exists: true, $ne: null } });
        console.log(users);
    
        if (!users.length) {
          return {
            message: 'No users found with valid FCM tokens',
            success: false,
          };
        }
    
        // Send notifications in parallel
        console.log("hi");
        await Promise.all(
          users.map(async (user) => {
            const token = user?.fcmToken;

            if (!token) return;
            await this.sendGlobalUserNotification(token, data.title, data.body);
    
            await this.createNotification({
              type: data.title,
              content: data.body,
              fromUser: 'system',
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
      console.log("this is my user ", data);
      try {
        // Fetch user token from your user DB or session DB
       
        const user = await this.userSessionModel.findOne({userId: data.userId});// todo 2- add databse name here 
        console.log(user);   
        const tokens = user?.fcmToken;
    
        if (!tokens) {
          return {
            message: 'No users found to send notifications',
            success: false,
          };
        }
        console.log("This is my user", user);
        console.log("This is my user", user.userId);

        
        // Send FCM notification to all users in parallel
        await this.sendFCMNotificationForAdmin(user.userId, data.title, data.body);
        await this.createNotification({
            type: data.title,
            content: data.body,
            fromUser: '',
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
        const user = await this.userSessionModel.findOne({userId: data.userId}); // todo 3- add databse name here (remove the ts ignore)  
        const token = user?.fcmToken;
        if (token) {
          await this.sendNotificationForCreateUser(token, data.userId);
        
          console.log("send notification completed");
          
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
        const user = await this.userSessionModel.findOne({userId: '684b3b088f9b672f8a4d2711'}); // todo 4- add databse name here
        console.log(user);
        const token = user?.fcmToken;
        if (token) {
          await this.sendNotificationForFollow(token, 'follow', data.userId);
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
    
            await this.sendNotificationForMention(token, 'mention', data.postId, data.userId);
    
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
