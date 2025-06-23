import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  NotificationDocument,
  Notification,
} from 'src/schema/notification.schema';
import { UserSession } from 'src/schema/user-session.schema';
import {
  followRequest,
  privateFollowRequest,
  SimpleUserResponse,
} from 'src/stubs/user';
import * as admin from 'firebase-admin';
import {
  FirebaseSendError,
  InvalidNotificationInputError,
  NotificationSaveError,
} from 'src/errors/notification.error';
import { DATABASE_CONSTANTS, ERROR_MESSAGES, FIREBASE_CONFIG, NOTIFICATION_MESSAGES, NOTIFICATION_TYPES, SUCCESS_MESSAGES } from 'src/constants';

@Injectable()
export class UserNotifyService {
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

  private async sendNotificationForFollow(
    tokens: string[],
    isPrivate: boolean,
    userName: string,
  ): Promise<void> {
    if (!tokens || tokens.length === 0) {
      console.warn(ERROR_MESSAGES.MISSING_FCM_TOKEN);
      return;
    }

    const title = isPrivate ? 'New Follow Request' : 'New Follower';
    const body = isPrivate
      ? `${userName} is requesting to follow you`
      : NOTIFICATION_MESSAGES.FOLLOW(userName);

    const messages = tokens.map((token) => ({
      token,
      notification: { title, body },
    }));

    try {
      const results = await Promise.allSettled(
        messages.map((msg) => admin.messaging().send(msg)),
      );

      const failedTokens: string[] = [];
      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          console.error(`Failed to send to ${tokens[i]}:`, result.reason);
          failedTokens.push(tokens[i]);
        }
      });

      if (failedTokens.length) {
        console.warn('Some tokens failed:', failedTokens);
      }
    } catch (err) {
      throw new FirebaseSendError(ERROR_MESSAGES.FIREBASE_SEND_ERROR);
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
      if (!data.type || !data.content || !data.senderId) {
        throw new InvalidNotificationInputError(ERROR_MESSAGES.MISSING_REQUIRED_FIELDS);
      }
      const notification = new this.notificationModel({
        ...data,
        createdAt: new Date(),
      });
      await notification.save();
      console.log(SUCCESS_MESSAGES.NOTIFICATION_SAVED, notification);
    } catch (error) {
      console.error(ERROR_MESSAGES.NOTIFICATION_SAVE_ERROR, error);
      throw new NotificationSaveError(error.message);
    }
  }

  private async sendNotificationForFollowPrivate(
    tokens: string[],
    isAccepted: boolean,
    fromUser: string,
  ): Promise<void> {
    if (!tokens || tokens.length === 0) {
      console.warn(ERROR_MESSAGES.MISSING_FCM_TOKEN);
      return;
    }

    const title = isAccepted ? 'Accepted Request' : 'Rejected Request';
    const body = isAccepted
      ? `${fromUser} accepted your request`
      : `${fromUser} rejected your request`;

    const messages = tokens.map((token) => ({
      token,
      notification: { title, body },
    }));

    try {
      const results = await Promise.allSettled(
        messages.map((msg) => admin.messaging().send(msg)),
      );

      const failedTokens: string[] = [];
      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          console.error(`Failed to send to ${tokens[i]}:`, result.reason);
          failedTokens.push(tokens[i]);
        }
      });

      if (failedTokens.length) {
        console.warn('Some tokens failed:', failedTokens);
      }
    } catch (err) {
      throw new FirebaseSendError(ERROR_MESSAGES.FIREBASE_SEND_ERROR);
    }
  }

  async follow(data: followRequest): Promise<SimpleUserResponse> {
    if (!data.userId || !data.targetId) {
      return {
        message: ERROR_MESSAGES.INVALID_INPUT_ERROR,
        status: 'false',
      };
    }

    try {
      const users = await this.userSessionModel.find({
        userId: data.targetId,
        status: DATABASE_CONSTANTS.USER_SESSION_STATUS.ACTIVE,
      });

      if (!users || users.length === 0) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      const tokens = users
        .map((s) => s.fcmToken)
        .filter((token): token is string => !!token);

      let sms = '';
      if (tokens.length > 0) {
        await this.sendNotificationForFollow(tokens, data.type, data.userName);
        
        if (data.type) {
          sms = `${data.userName} is requesting to follow you.`;
        } else {
          sms = NOTIFICATION_MESSAGES.FOLLOW(data.userName);
        }

        await this.createNotification({
          recieverId: data.targetId,
          senderName: data.userName,
          type: data.type ? NOTIFICATION_TYPES.FOLLOW : 'public_follow',
          content: sms,
          senderId: data.userId,
          postId: '',
        });
      }

      return {
        message: sms,
        status: 'true',
      };
    } catch (err) {
      console.error('Error while sending post notifications:', err);
      return { message: 'Something went wrong', status: 'false' };
    }
  }

  async followPrivate(data: privateFollowRequest): Promise<SimpleUserResponse> {
    if (!data.userId) {
      return {
        message: ERROR_MESSAGES.INVALID_INPUT_ERROR,
        status: 'false',
      };
    }

    try {
      const users = await this.userSessionModel.find({
        userId: data.userId,
        status: DATABASE_CONSTANTS.USER_SESSION_STATUS.ACTIVE,
      });

      if (!users || users.length === 0) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }
      
      const tokens = users
        .map((s) => s.fcmToken)
        .filter((token): token is string => !!token);

      let sms = `${data.userName} rejected your request.`;
      if (tokens.length > 0) {
        await this.sendNotificationForFollowPrivate(
          tokens,
          data.type,
          data.userName,
        );
        if (data.type) {
          sms = `${data.userName} accepted your request`;
        }

        await this.createNotification({
          recieverId: data.userId,
          senderName: data.userName,
          type: data.type ? 'accepted_request' : 'rejected_request',
          content: sms,
          senderId: '',
          postId: '',
        });
      }

      return {
        message: sms,
        status: 'true',
      };
    } catch (err) {
      console.error('Error while handling private follow:', err);
      return { message: 'Something went wrong', status: 'false' };
    }
  }
}
