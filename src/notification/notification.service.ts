// import { Injectable } from '@nestjs/common';
// import * as admin from 'firebase-admin';
// import { Model } from 'mongoose';
// import { InjectModel } from '@nestjs/mongoose';
// import {
//   NotificationDocument,
//   Notification,
// } from '../schema/notification.schema';
// import {
//   FirebaseSendError,
//   InvalidNotificationInputError,
//   NotificationSaveError,
// } from 'src/errors/notification.error';
// import { UserSession } from 'src/schema/user-session.schema';

// @Injectable()
// export class NotificationService {
//   constructor(
//     @InjectModel(Notification.name)
//     private readonly notificationModel: Model<NotificationDocument>,
//     @InjectModel(UserSession.name)
//     private readonly userSessionModel: Model<UserSession>,
//   ) {
//     const serviceAccount = require('/home/user/Assignment/social_media/Notification/firebase.json');

//     if (!admin.apps.length) {
//       admin.initializeApp({
//         credential: admin.credential.cert(serviceAccount),
//       });
//     }
//   }

//   generateNotificationMessage(action: string, postId: string, username: string): string {
//     switch (action) {
//       case 'comment':
//         return `${username ?? 'Someone'} commented on your post: ${postId}`;
//       case 'like':
//         return `${username ?? 'Someone'} liked your post: ${postId}`;
//       default:
//         return 'You have a new notification.';
//     }
//   }

//   generateNotificationMessageForReply(action: string, username: string, parentCommentId: string): string {
//     switch (action) {
//       case 'reply':
//         return `${username ?? 'Someone'} replied to your comment: ${parentCommentId}`;
//       default:
//         return 'You have a new notification.';
//     }
//   }

//   async sendNotification( postOwnerId: string, action: string, postId: string,userId: string,username: string): Promise<void>{
//     try{
//       const user = await this.userSessionModel.findOne({
//         userId,
//         status: 'active'
//       })
//       console.log(user);
//       if(!user || user.fcmToken){
//         console.warn(`No active session or missing token for user: ${userId}`);
//         return;
//       }
//       const token = user.fcmToken;
//       const messageText = this.generateNotificationMessage(
//         action,
//         postId ?? '',
//         username ?? ''
//       );
//       console.log('Generated message:', messageText);

//       await this.createNotification({
//         recieverId: postOwnerId,
//         senderName: username ?? 'Someone',
//         type: action,
//         content: messageText,
//         senderId: userId ?? '',
//         postId: postId ?? '',
//         postUrl: '',
//       });

//       const message = this.buildNotificationMessage(token as string, messageText);
//       console.log("Message",message)

//       const response = await admin.messaging().send(message);
//       console.log(`Notification sent to ${userId}:`, response);
//     }
//     catch(err){
//       console.error(`Failed to send notification to ${userId}:`, err);
//       throw new FirebaseSendError(err.message);
//     }
//   }

//   async sendNotificationForReply( postOwnerId: string, action: string, postId: string,userId: string,username: string, parentCommentId: string): Promise<void> {
//     try {
//       const user = await this.userSessionModel.findOne({
//         userId,
//         status: 'active',
//       });
//       console.log(user);
//       if (!user || !user.fcmToken) {
//         console.warn(`No active session or missing token for user: ${userId}`);
//         return;
//       }

//       const token = user.fcmToken;
//       const messageText = this.generateNotificationMessageForReply(
//         action,
//         username ?? '',
//         parentCommentId,
//       );

//       console.log('Generated message:', messageText);

//       await this.createNotification({
//         recieverId: postOwnerId,
//         senderName: username ?? 'Someone',
//         type: action,
//         content: messageText,
//         senderId: userId ?? '',
//         postId: postId ?? '',
//         postUrl: '',
//       });

//       const message = this.buildNotificationMessage(token, messageText);
//       console.log("Message",message)

//       const response = await admin.messaging().send(message);
//       console.log(`Notification sent to ${userId}:`, response);
//     } catch (err) {
//       console.error(`Failed to send notification to ${userId}:`, err);
//       throw new FirebaseSendError(err.message);
//     }
//   }

//   private buildNotificationMessage(token: string, messageText: string) {
//     return {
//       token,
//       notification: {
//         title: 'New Notification',
//         body: messageText,
//       },
//     };
//   }

//   async createNotification(data: { recieverId: string; senderName: string; type: string; content: string; senderId?: string; postId?: string; postUrl?: string}): Promise<void> {
//     try {
//       const { type, content, senderId } = data;
//       console.log(data);
//       // if (!type || !content || !senderId) {
//       //   throw new InvalidNotificationInputError('Missing required fields.');
//       // }

//       const notification = new this.notificationModel({
//         ...data,
//         createdAt: new Date(),
//       });

//       await notification.save();
//       console.log('Notification saved to DB:', notification);
//     } catch (error) {
//       console.error('Error saving notification:', error);
//       throw new NotificationSaveError(error.message);
//     }
//   }
// }


import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  NotificationDocument,
  Notification,
} from '../schema/notification.schema';
import {
  FirebaseSendError,
  InvalidNotificationInputError,
  NotificationSaveError,
} from 'src/errors/notification.error';
import { UserSession } from 'src/schema/user-session.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(UserSession.name)
    private readonly userSessionModel: Model<UserSession>,
  ) {
    const serviceAccount = require('/home/user/Assignment/social_media/Notification/firebase.json');

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  }

  generateNotificationMessage(action: string, postId: string, username: string): string {
    switch (action) {
      case 'comment':
        return `${username ?? 'Someone'} commented on your post: ${postId}`;
      case 'like':
        return `${username ?? 'Someone'} liked your post: ${postId}`;
      default:
        return 'You have a new notification.';
    }
  }

  generateNotificationMessageForReply(action: string, username: string, parentCommentId: string): string {
    if (action === 'reply') {
      return `${username ?? 'Someone'} replied to your comment: ${parentCommentId}`;
    }
    return 'You have a new notification.';
  }

  async sendNotification(postOwnerId: string, action: string, postId: string, userId: string, username: string, mediaUrl: string): Promise<void> {
    try {
      const user = await this.userSessionModel.findOne({ userId: postOwnerId, status: 'active' });
      console.log(user);
      if (!user || !user.fcmToken) {
        console.warn(`No active session or missing token for user: ${userId}`);
        return;
      }

      const token = user.fcmToken;
      const messageText = this.generateNotificationMessage(action, postId, username);

      await this.createNotification({
        recieverId: postOwnerId,
        senderName: username ?? 'Someone',
        type: action,
        content: messageText,
        senderId: userId,
        postId,
        postUrl: mediaUrl,
      });

      const message = this.buildNotificationMessage(token, messageText);
      const response = await admin.messaging().send(message);
      console.log(`Notification sent to ${userId}:`, response);
    } catch (err) {
      console.error(`Failed to send notification to ${userId}:`, err);
      throw new FirebaseSendError(err.message);
    }
  }

  async sendNotificationForReply(postOwnerId: string, action: string, postId: string, userId: string, username: string, parentCommentId: string, mediaUrl: string): Promise<void> {
    try {
      const user = await this.userSessionModel.findOne({ userId: postOwnerId, status: 'active' });

      if (!user || !user.fcmToken) {
        console.warn(`No active session or missing token for user: ${userId}`);
        return;
      }

      const token = user.fcmToken;
      const messageText = this.generateNotificationMessageForReply(action, username, parentCommentId);

      await this.createNotification({
        recieverId: postOwnerId,
        senderName: username ?? 'Someone',
        type: action,
        content: messageText,
        senderId: userId,
        postId,
        postUrl: mediaUrl,
      });

      const message = this.buildNotificationMessage(token, messageText);
      const response = await admin.messaging().send(message);
      console.log(`Notification sent to ${userId}:`, response);
    } catch (err) {
      console.error(`Failed to send notification to ${userId}:`, err);
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
    recieverId: string;
    senderName: string;
    type: string;
    content: string;
    senderId: string;
    postId: string;
    postUrl: string;
  }): Promise<void> {
    try {
      const notification = new this.notificationModel({
        ...data,
        createdAt: new Date(),
      });
      await notification.save();
      console.log('Notification saved to DB:', notification);
    } catch (error) {
      console.error('Error saving notification:', error);
      throw new NotificationSaveError(error.message);
    }
  }
}
