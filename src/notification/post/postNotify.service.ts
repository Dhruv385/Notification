import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  TagNotificationRequest,
  TagNotificationResponse,
} from 'src/stubs/post';
import { UserSession } from 'src/schema/user-session.schema';
import {
  NotificationDocument,
  Notification,
} from 'src/schema/notification.schema';
import {
  FirebaseSendError,
  InvalidNotificationInputError,
  NotificationSaveError,
} from 'src/errors/notification.error';
import { DATABASE_CONSTANTS, ERROR_MESSAGES, FIREBASE_CONFIG, LOG_CONSTANTS, NOTIFICATION_MESSAGES, NOTIFICATION_TYPES, SUCCESS_MESSAGES } from 'src/constants';

@Injectable()
export class PostNotifyService {
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

  private async sendNotificationForMention(
    tokens: string[],
    type: string,
    postId: string,
    fromUser: string,
    posturl: string,
    username: string,
  ): Promise<void> {
    if (!tokens.length) {
      console.warn(ERROR_MESSAGES.MISSING_FCM_TOKEN);
      return;
    }

    let title = '';
    let body = '';

    switch (type) {
      case NOTIFICATION_TYPES.MENTION:
        title = 'You were mentioned!';
        body = NOTIFICATION_MESSAGES.MENTION(username);
        break;
      default:
        title = type;
        body = `${username} performed ${type} action`;
    }

    const messages = tokens.map((token) => ({
      token,
      notification: { title, body },
      data: {
        type,
        postId,
        fromUser,
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
        `Mention Notification sent (Success: ${tokens.length - failedTokens.length}, Failed: ${failedTokens.length})`,
      );
    } catch (error) {
      console.error(LOG_CONSTANTS.LOG_PREFIXES.FIREBASE, `Error in sending mention notifications:`, error);
      throw new FirebaseSendError(error.message);
    }
  }

  async createNotificationForMention(data: {
    recieverId: string;
    senderName: string;
    type: string;
    content: string;
    senderId: string;
    postId: string;
    postUrl: string;
  }): Promise<void> {
    try {
      if (!data.type || !data.content || !data.senderId || !data.postId) {
        throw new InvalidNotificationInputError(ERROR_MESSAGES.MISSING_REQUIRED_FIELDS);
      }
      const notification = new this.notificationModel({
        ...data,
        createdAt: new Date(),
      });
      await notification.save();

      console.log(SUCCESS_MESSAGES.NOTIFICATION_SAVED, notification);
    } catch (error) {
      console.error(LOG_CONSTANTS.LOG_PREFIXES.DATABASE, ERROR_MESSAGES.NOTIFICATION_SAVE_ERROR, error);
      throw new NotificationSaveError(error.message);
    }
  }

  async mentionNotification(data: TagNotificationRequest): Promise<TagNotificationResponse> {
    try {
      const users = await this.userSessionModel.find({
        userId: { $in: data.TagedUserIds },
        status: DATABASE_CONSTANTS.USER_SESSION_STATUS.ACTIVE,
      });
      await Promise.all(users.map(async (user) => {
          if (!user.fcmToken) return;

          const tokens = user.fcmToken.split(',').map((t) => t.trim()).filter(Boolean);
          if (!tokens.length) return;
          
          const message = NOTIFICATION_MESSAGES.MENTION(data.username);
          const postKey=data.postUrl;
          
          await this.sendNotificationForMention(
            tokens,
            NOTIFICATION_TYPES.MENTION,
            data.postId,
            data.userId,
            postKey,
            data.username
          );

          await this.createNotificationForMention({
            recieverId: user.userId,
            senderName: data.username,
            type: NOTIFICATION_TYPES.MENTION,
            content: message,
            senderId: data.userId,
            postId: data.postId,
            postUrl: postKey
          });
        }),
      );

      return {
        message: SUCCESS_MESSAGES.NOTIFICATION_SENT,
        success: true,
      };
    } catch (error) {
      console.error('Error in mentionNotification:', error);
      return {
        message: ERROR_MESSAGES.FIREBASE_SEND_ERROR,
        success: false,
      };
    }
  }
}
