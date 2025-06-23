import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserSession } from 'src/schema/user-session.schema';
import {
  NotificationResponse,
  SendGlobalNotificationRequest,
  SendUserNotification,
} from 'src/stubs/admin';
import {
  NotificationDocument,
  Notification,
} from '../../schema/notification.schema';
import { Model } from 'mongoose';
import * as admin from 'firebase-admin';
import {
  FirebaseSendError,
  InvalidNotificationInputError,
  NotificationSaveError,
} from 'src/errors/notification.error';
import { DATABASE_CONSTANTS, ERROR_MESSAGES, FIREBASE_CONFIG, LOG_CONSTANTS, NOTIFICATION_CATEGORIES, SUCCESS_MESSAGES } from 'src/constants';

@Injectable()
export class AdminNotifyService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
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

  private async sendGlobalUserNotification(
    tokens: string[],
    title: string,
    body: string,
  ): Promise<{ successCount: number }> {
    const messages = tokens.map((token) => ({
      token,
      notification: {
        title,
        body,
      },
    }));
    let successCount = 0;
    try {
      const results = await Promise.allSettled(
        messages.map((msg) => admin.messaging().send(msg)),
      );

      const failedTokens: string[] = [];
      results.forEach((res, i) => {
        if (res.status === 'rejected') {
          console.error(`Failed to send to ${tokens[i]}:`, res.reason);
          failedTokens.push(tokens[i]);
        } else {
          successCount++;
        }
      });

      console.log(
        `Global Notification sent (Success: ${tokens.length - failedTokens.length}, Failed: ${failedTokens.length})`,
      );
      return { successCount };
    } catch (err) {
      console.error(LOG_CONSTANTS.LOG_PREFIXES.FIREBASE, 'Error sending global notifications:', err);
      throw new FirebaseSendError(err.message);
    }
  }

  async createNotification(data: {
    recieverId: string;
    senderName: string;
    type: string;
    content: string;
    senderId: string;
    postId: string;
  }): Promise<void> {
    try {
      if (!data.type || !data.content || !data.senderName || !data.recieverId) {
        throw new InvalidNotificationInputError(ERROR_MESSAGES.MISSING_REQUIRED_FIELDS);
      }
      const notification = new this.notificationModel({
        recieverId: data.recieverId,
        senderName: data.senderName,
        type: data.type,
        content: data.content,
        senderId: '',
        postId: '',
        createdAt: new Date(),
      });
      await notification.save();

      console.log(SUCCESS_MESSAGES.NOTIFICATION_SAVED, notification);
    } catch (err) {
      console.error(LOG_CONSTANTS.LOG_PREFIXES.DATABASE, ERROR_MESSAGES.NOTIFICATION_SAVE_ERROR, err);
      throw new NotificationSaveError(err.message);
    }
  }
  async sendFCMNotificationForAdmin(
    tokens: string[],
    title: string,
    body: string,
  ): Promise<void> {
    const messages = tokens.map((token) => ({
      token,
      notification: {
        title,
        body,
      },
    }));
    try {
      const results = await Promise.allSettled(
        messages.map((msg) => admin.messaging().send(msg)),
      );

      const failedTokens: string[] = [];
      results.forEach((res, i) => {
        if (res.status === 'rejected') {
          console.error(`Failed to send to ${tokens[i]}:`, res.reason);
          failedTokens.push(tokens[i]);
        }
      });

      console.log(
        `User Notification sent (Success: ${tokens.length - failedTokens.length}, Failed: ${failedTokens.length})`,
      );
    } catch (err) {
      console.error(LOG_CONSTANTS.LOG_PREFIXES.FIREBASE, 'Error sending user notifications:', err);
      throw new FirebaseSendError(err.message);
    }
  }

  // --GRPC METHOD SERVICES
  async sendGlobalNotification(
    data: SendGlobalNotificationRequest,
  ): Promise<NotificationResponse> {
    try {
      // Fetch all users with FCM tokens
      const users = await this.userSessionModel.find({
        fcmToken: { $exists: true, $ne: null },
        status: DATABASE_CONSTANTS.USER_SESSION_STATUS.ACTIVE,
      });
      console.log(users);

      if (!users.length) {
        return {
          message: ERROR_MESSAGES.USER_NOT_FOUND,
          success: false,
        };
      }
      // Send notifications in parallel
      // console.log("hi");

      let successCount: any = 0;
      let failureCount = 0;

      await Promise.all(
        users.map(async (user) => {
          try {
            const rawTokens = user.fcmToken;
            if (!rawTokens) {
              failureCount++;
              return;
            }

            const tokens = rawTokens
              .split(',')
              .map((t) => t.trim())
              .filter((t) => t && !t.includes('example'));

            if (tokens.length === 0) {
              failureCount++;
              return;
            }

            const result = await this.sendGlobalUserNotification(
              tokens,
              data.title,
              data.body,
            );

            if (result.successCount > 0) {
              await this.createNotification({
                recieverId: user.userId,
                senderName: 'Admin',
                type: data.title || NOTIFICATION_CATEGORIES.SYSTEM,
                content: data.body || '',
                senderId: 'Admin',
                postId: '',
              });
              successCount++;
            } else {
              failureCount++;
            }
          } catch (err) {
            console.error('Error processing user notification:', err);
            failureCount++;
          }
        }),
      );

      return {
        message: SUCCESS_MESSAGES.NOTIFICATION_SENT,
        success: true,
      };
    } catch (err) {
      console.error('Global notification error:', err);
      return {
        message: ERROR_MESSAGES.FIREBASE_SEND_ERROR,
        success: false,
      };
    }
  }

  async sendUserNotification(
    data: SendUserNotification,
  ): Promise<NotificationResponse> {
    // console.log("this is my user ", data);
    try {
      const users = await this.userSessionModel.find({
        userId: data.userId,
        status: DATABASE_CONSTANTS.USER_SESSION_STATUS.ACTIVE,
      });
      if (!users || users.length === 0) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }
      // console.log(user);
      await Promise.all(
        users.map(async (user) => {
          try {
            const rawTokens = user.fcmToken;
            if (!rawTokens) return;
            const tokens = rawTokens.split(',').map((t) => t.trim());
            console.log(tokens);
            if (tokens.length == 0) {
              return {
                message: ERROR_MESSAGES.MISSING_FCM_TOKEN,
                success: false,
              };
            }

            await this.sendFCMNotificationForAdmin(
              tokens,
              data.title,
              data.body,
            );
            
            await this.createNotification({
              recieverId: data.userId,
              senderName: 'Admin',
              type: data.title,
              content: data.body,
              senderId: 'Admin',
              postId: '',
            });
          } catch (error) {
            console.error(
              `Failed to send notification to user ${user.userId}`,
              error,
            );
          }
        }),
      );
      return {
        message: SUCCESS_MESSAGES.NOTIFICATION_SENT,
        success: true,
      };
    } catch (err) {
      console.error('Error sending user-specific notification:', err);
      return {
        message: ERROR_MESSAGES.FIREBASE_SEND_ERROR,
        success: false,
      };
    }
  }
}
