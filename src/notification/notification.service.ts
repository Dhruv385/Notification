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
        return `${username} commented on your post`;
      case 'like':
        return `${username} liked your post`;
      default:
        return 'You have a new notification.';
    }
  }

  generateNotificationMessageForReply(action: string, username: string, parentCommentId: string): string {
    if (action === 'reply') {
      return `${username} replied to your comment`;
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
      throw new FirebaseSendError(err.message);
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
      throw new NotificationSaveError(error.message);
    }
  }

}
