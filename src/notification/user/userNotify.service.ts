import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { NotificationDocument, Notification } from "src/schema/notification.schema";
import { UserSession } from "src/schema/user-session.schema";
import { CreateUserRequest, FollowRequest, UserResponse } from "src/stubs/user";
import * as admin from 'firebase-admin';
import { FirebaseSendError, InvalidNotificationInputError, NotificationSaveError } from "src/errors/notification.error";


@Injectable()
export class UserNotifyService {
    constructor(@InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
        @InjectModel(UserSession.name) private readonly userSessionModel: Model<UserSession>,) {
            const serviceAccount = require('/home/user/Assignment/social_media/Notification/firebase.json');
            
            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
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
        } 
        catch (error) {
            console.error(`Failed to send create user notification to token ${token}:`, error);
            throw new FirebaseSendError(error.message);
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
        } 
        catch (error) {
            console.error(`Failed to send ${type} notification to token ${token}:`, error);
            throw new FirebaseSendError(error.message);
        }
    }

    async createNotification(data: {recieverId: string; senderName: string; type: string;content: string; senderId: string; postId: string;}): Promise<void> {
        try {
            if (!data.type || !data.content || !data.senderId) {
                throw new InvalidNotificationInputError('Missing required fields');
            }
            // Save notification to database
            const notification = new this.notificationModel({
                recieverId: data.recieverId,
                senderName: data.senderName,
                type: data.type,
                content: data.content,
                senderId: data.senderId,
                postId: data.postId,
                createdAt: new Date()
            });
            await notification.save();
              
            console.log('Notification saved:', notification);
        } 
        catch (error) {
            console.error('Error creating notification:', error);
            throw new NotificationSaveError(error.message);
        }
    }


    // --GRPC METHOD
    async create(data: CreateUserRequest): Promise<UserResponse> {
        if (!data.userId) {
            return {
              message: `User not Created`,
              status: 'false',
            };
        }
        try{
            const user = await this.userSessionModel.findOne({userId: data.userId});  
            if(!user){
                throw new Error('User not found');
            }
            const token = user?.fcmToken;
            if (token) {
              await this.sendNotificationForCreateUser(token, data.userId);
            
              console.log("send notification completed");
              
              await this.createNotification({
                recieverId: data.userId,
                senderName: data.userName,
                type: 'create',
                content: `Welcome ${data.userId}!`,
                senderId: '',
                postId: '',
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
        // console.log(data);
        if (!data.userId || !data.targetId) {
            return {
              message: `Invalid follow request: missing userId or targetId`,
              status: 'false',
            };
        }
        
        try{
            const user = await this.userSessionModel.findOne({userId: data.userId}); 
            if(!user){
                throw new Error('User not found');
            }
            const token = user?.fcmToken;
            if (token) {
              await this.sendNotificationForFollow(token, 'follow', data.userId);
              await this.createNotification({
                recieverId: data.userId,
                senderName: data.userName,
                type: 'follow',
                content: `${data.userId} followed you`,
                senderId: data.targetId,
                postId: '',
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
}