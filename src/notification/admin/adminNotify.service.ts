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

    private async sendGlobalUserNotification(tokens: string[], title: string, body: string):Promise<{ successCount: number }>  {
        const messages = tokens.map((token) => ({
            token,
            notification: {
                title,
                body,
            },
        }));
        let successCount = 0;
        try {
            const results = await Promise.allSettled(messages.map(msg => admin.messaging().send(msg)));
          
            const failedTokens: string[] = [];
            results.forEach((res, i) => {
                if (res.status === 'rejected') {
                  console.error(`Failed to send to ${tokens[i]}:`, res.reason);
                  failedTokens.push(tokens[i]);
                }
                else{
                    successCount++;
                }
            });
          
            console.log(`Global Notification sent (Success: ${tokens.length - failedTokens.length}, Failed: ${failedTokens.length})`);
            return {successCount};
        } 
        catch (err) {
            console.error('Error sending global notifications:', err);
            throw new FirebaseSendError(err.message);
        }
    }
          
    async createNotification(data: {recieverId: string; senderName: string; type: string; content: string; senderId: string; postId: string;}): Promise<void> {
        try {
            if (!data.type || !data.content || !data.senderName || !data.recieverId) {
                throw new InvalidNotificationInputError('Missing required fields');
            }
            // Save notification to database
            const notification = new this.notificationModel({
                recieverId: data.recieverId,
                senderName: data.senderName,
                type: data.type,
                content: data.content,
                senderId: '',
                postId: '',
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
            
            const session = await this.userSessionModel.findOne({ userId, status: 'active' });
      
            if (!session || !session.fcmToken) {
              console.warn(`No FCM token found for user ${userId}`);
              return;
            }

            const tokens = session.fcmToken.split(',').map(t => t.trim()).filter(Boolean);
      
            const messages = tokens.map(token => ({
                token,
                notification: {
                  title,
                  body,
                },
                data: {
                  userId,
                },
            }));
          
            const results = await Promise.allSettled(messages.map(msg => admin.messaging().send(msg)));

            const failedTokens: string[] = [];          
            results.forEach((res, i) => {
                if (res.status === 'rejected') {
                  console.error(`Failed to send to ${tokens[i]}:`, res.reason);
                  failedTokens.push(tokens[i]);
                }
            });
            console.log(`Notifications sent to user ${userId} (Success: ${tokens.length - failedTokens.length}, Failed: ${failedTokens.length})`);
        } 
        catch (err) {
            console.error(`Error sending FCM to user ${userId}:`, err);
        }
    }


    // --GRPC METHOD SERVICES
    async sendGlobalNotification(data: SendGlobalNotificationRequest): Promise<NotificationResponse> {
        try {
            // Fetch all users with FCM tokens
            const users = await this.userSessionModel.find({ fcmToken: { $exists: true, $ne: null }, status: 'active' });
            console.log(users);
        
            if (!users.length) {
                return {
                    message: 'No users found with valid FCM tokens',
                    success: false,
                };
            }
            // Send notifications in parallel
            // console.log("hi");

            let successCount: any = 0;
            let failureCount = 0;

            await Promise.all(
                users.map(async (user) => {
                    try{
                        const rawTokens = user.fcmToken;
                        if (!rawTokens){
                            failureCount++;
                            return;
                        } 

                        const tokens = rawTokens.split(',').map(t => t.trim()).filter(t => t && !t.includes('example'));
                        
                        if (tokens.length === 0) {
                            failureCount++;
                            return;
                        }
        
                        const result = await this.sendGlobalUserNotification(tokens, data.title, data.body);
            
                        if (result.successCount > 0) {
                            await this.createNotification({
                                recieverId: user.userId,
                                senderName: 'Admin',
                                type: data.title || 'General',
                                content: data.body || '',
                                senderId: 'Admin',
                                postId: '',
                            });
                            successCount++;
                        } else {
                            failureCount++;
                        }
                    }
                    catch(err){
                        console.error('Error processing user notification:', err);
                        failureCount++;
                    }
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
            const user = await this.userSessionModel.findOne({userId: data.userId, status: 'active'});
            if(!user){
                throw new Error('User not found');
            }
            // console.log(user);   
            const tokens = user?.fcmToken ? user.fcmToken.split(',').map(t => t.trim()).filter(Boolean) : [];
            if (tokens.length === 0) {
                return {
                    message: 'No FCM tokens found for user',
                    success: false,
                };
            }
            // console.log("This is my user", user);
            // console.log("This is my user", user.userId);
    
            
            await this.sendFCMNotificationForAdmin(user.userId, data.title, data.body);
            await this.createNotification({
                recieverId: user.userId,
                senderName: 'Admin',
                type: data.title,
                content: data.body,
                senderId: 'Admin',
                postId: '',
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