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
  NotificationSaveError,
} from 'src/errors/notification.error';
import { UserSession } from 'src/schema/user-session.schema';
import { 
  DATABASE_CONSTANTS, 
  ERROR_MESSAGES, 
  FIREBASE_CONFIG, 
  NOTIFICATION_MESSAGES, 
  NOTIFICATION_TYPES 
} from '../constants';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(UserSession.name)
    private readonly userSessionModel: Model<UserSession>,
  ) {
    const serviceAccount = require(FIREBASE_CONFIG.SERVICE_ACCOUNT_PATH);

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  }

  generateNotificationMessage(action: string, username: string): string {
    switch (action) {
      case NOTIFICATION_TYPES.COMMENT:
        return NOTIFICATION_MESSAGES.COMMENT(username);
      case NOTIFICATION_TYPES.LIKE:
        return NOTIFICATION_MESSAGES.LIKE(username);
      case NOTIFICATION_TYPES.REPLY:
        return NOTIFICATION_MESSAGES.REPLY(username);
      default:
        return NOTIFICATION_MESSAGES.DEFAULT;
    }
  }

  async sendNotification(postOwnerId: string, action: string, postId: string, userId: string, username: string, mediaUrl: string): Promise<void> {
    try {
      const user = await this.userSessionModel.findOne({ userId: postOwnerId, status: DATABASE_CONSTANTS.USER_SESSION_STATUS.ACTIVE });
      console.log(user);
      if (!user || !user.fcmToken) {
        console.warn(`${ERROR_MESSAGES.USER_NOT_FOUND} for user: ${userId}`);
        return;
      }

      const token = user.fcmToken;
      const messageText = this.generateNotificationMessage(action, username);
      console.log(username)
      console.log(mediaUrl)

      
      await this.createNotification({
        recieverId: postOwnerId,
        senderName: username,
        type: action,
        content: messageText,
        senderId: userId,
        postId,
        posturl: mediaUrl,
      });

      const message = this.buildNotificationMessage(token, messageText,action);
      const response = await admin.messaging().send(message);
      console.log(`Notification sent to ${userId}:`, response);
    } catch (err) {
      console.error(`Failed to send notification to ${userId}:`, err);
      throw new FirebaseSendError(ERROR_MESSAGES.FIREBASE_SEND_ERROR);
    }
  }

  async sendNotificationForReply(postOwnerId: string, action: string, postId: string, userId: string, username: string, parentCommentId: string, mediaUrl: string): Promise<void> {
    try {
      const user = await this.userSessionModel.findOne({ userId: postOwnerId, status: DATABASE_CONSTANTS.USER_SESSION_STATUS.ACTIVE });

      if (!user || !user.fcmToken) {
        console.warn(`${ERROR_MESSAGES.USER_NOT_FOUND} for user: ${userId}`);
        return;
      }

      const token = user.fcmToken;
      const messageText = this.generateNotificationMessage(action, username);

      await this.createNotification({
        recieverId: postOwnerId,
        senderName: username,
        type: action,
        content: messageText,
        senderId: userId,
        postId,
        posturl: mediaUrl,
      });

      const message = this.buildNotificationMessage(token, messageText,action);
      const response = await admin.messaging().send(message);
      console.log(`Notification sent to ${userId}:`, response);
    } catch (err) {
      console.error(`Failed to send notification to ${userId}:`, err);
      throw new FirebaseSendError(ERROR_MESSAGES.FIREBASE_SEND_ERROR);
    }
  }

  private buildNotificationMessage(token: string, messageText: string,action: string) {
    return {
      token,
      notification: {
        title: action,
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
    posturl: string;
  }): Promise<void> {
    try {
      console.log("2nd",data.posturl)
      const notification = await this.notificationModel.create({
        ...data,
        createdAt: new Date(),
      });
      // await notification.save();
      console.log('Notification saved to DB:', notification);
    } catch (error) {
      console.error('Error saving notification:', error);
      throw new NotificationSaveError(ERROR_MESSAGES.NOTIFICATION_SAVE_ERROR);
    }
  }

}
