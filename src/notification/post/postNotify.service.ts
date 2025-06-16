import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { TagNotificationRequest, TagNotificationResponse } from 'src/stubs/post';
import { UserSession } from 'src/schema/user-session.schema';
import { NotificationDocument, Notification} from 'src/schema/notification.schema';
import { FirebaseSendError, InvalidNotificationInputError, NotificationSaveError } from 'src/errors/notification.error';

@Injectable()
export class PostNotifyService {
    constructor(@InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(UserSession.name) private readonly userSessionModel: Model<UserSession>){
        const serviceAccount = require('/home/user/Assignment/social_media/Notification/firebase.json');

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        }
    }

    private async sendNotificationForMention(token: string,type: string,postId: string,fromUser: string): Promise<void> {
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
        } 
        catch (error) {
            console.error(`Failed to send mention notification to ${token}:`, error);
            throw new FirebaseSendError(error.message);
        }
    }

    async createNotification(data: {recieverId: string; senderName: string; type: string;content: string; senderId: string; postId: string;}): Promise<void> {
        try {
            if (!data.type || !data.content || !data.senderId || !data.postId) {
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

    async mentionNotification(data: TagNotificationRequest): Promise<TagNotificationResponse> {
        try {
            const users = await this.userSessionModel.find({userId: { $in: data.TagedUserIds }});
            await Promise.all(
                users.map(async (user) => {
                  if(!user.fcmToken) 
                    return; // skip devices without a token
          
                  const message = `${data.userId} tagged you in a post: ${data.postId}`;
                  await this.sendNotificationForMention(user.fcmToken,'mention',data.postId,data.userId); 
                  await this.createNotification({
                    recieverId: user.userId,
                    senderName: data.username,
                    type: 'mention',
                    content: message,
                    senderId: data.userId,  
                    postId: data.postId,
                  });
                }),
            );
          
            return {
                message: 'Mention notifications sent successfully',
                success: true,
            };
        } 
        catch (error) {
            console.error('Error in mentionNotification:', error);
            return {
                message: 'Failed to send mention notifications',
                success: false,
            };
        }
    }
}