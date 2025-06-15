import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { UserSession } from "src/schema/user-session.schema";
import { NotificationResponse, SendGlobalNotificationRequest, SendUserNotification } from "src/stubs/admin";
import { NotificationDocument, Notification } from "../../schema/notification.schema";
import { Model } from "mongoose";
import * as admin from 'firebase-admin';
import { FirebaseSendError, InvalidNotificationInputError, NotificationSaveError } from "src/errors/notification.error";


@Injectable()
export class AdminNotifyService {
    constructor(@InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
        @InjectModel(UserSession.name) private readonly userSessionModel: Model<UserSession>){
            const serviceAccount = require('/home/user/Assignment/social_media/Notification/firebase.json');
            
            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
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
        } 
        catch (err) {
            console.error(`Failed to send global notification to ${token}:`, err);
            throw new FirebaseSendError(err.message);
        }
    }
    async createNotification(data: {type: string;content: string;data?: any;toToken: string;fromUser: string;}): Promise<void> {
        try {
            if (!data.type || !data.content || !data.toToken || !data.fromUser) {
                throw new InvalidNotificationInputError('Missing required fields');
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
        }
        catch (err) {
            console.error('Error creating notification:', err);
            throw new NotificationSaveError(err.message);
        }
    }
    async sendFCMNotificationForAdmin(userId: string,title: string,body: string): Promise<void> {
        try {
            
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
              },
            };
      
            const response = await admin.messaging().send(message);
            console.log(`FCM sent to user ${userId}:`, response);
        } 
        catch (err) {
            console.error(`Error sending FCM to user ${userId}:`, err);
        }
    }


    // --GRPC METHOD SERVICES
    async sendGlobalNotification(data: SendGlobalNotificationRequest): Promise<NotificationResponse> {
        try {
            // Fetch all users with FCM tokens
            const users = await this.userSessionModel.find({ fcmToken: { $exists: true, $ne: null } });
            // console.log(users);
        
            if (!users.length) {
                return {
                    message: 'No users found with valid FCM tokens',
                    success: false,
                };
            }
            // Send notifications in parallel
            // console.log("hi");
            await Promise.all(
                users.map(async (user) => {
                    const token = user?.fcmToken;
    
                    if (!token) return;
                    await this.sendGlobalUserNotification(token, data.title, data.body);
        
                    await this.createNotification({
                    type: data.title,
                    content: data.body,
                    data: null,
                    toToken: token,
                    fromUser: 'System',
                    });
                })
            );
        
            return {
                message: 'Global notification sent successfully to all users',
                success: true,
            };
        } 
        catch (err) {
            console.error('Global notification error:', err);
            return {
                message: 'Failed to send global notification',
                success: false,
            };
        }
    }
        
    
    async sendUserNotification(data: SendUserNotification): Promise<NotificationResponse>{
        // console.log("this is my user ", data);
        try {
            const user = await this.userSessionModel.findOne({userId: data.userId});
            if(!user){
                throw new Error('User not found');
            }
            // console.log(user);   
            const tokens = user?.fcmToken;
        
            if (!tokens) {
              return {
                message: 'No users found to send notifications',
                success: false,
              };
            }
            // console.log("This is my user", user);
            // console.log("This is my user", user.userId);
    
            
            await this.sendFCMNotificationForAdmin(user.userId, data.title, data.body);
            await this.createNotification({
                type: data.title,
                content: data.body,
                data: null,
                toToken: tokens,
                fromUser: 'System',
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
}