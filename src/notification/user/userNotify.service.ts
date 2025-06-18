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

@Injectable()
export class UserNotifyService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
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

  private async sendNotificationForFollow(
    tokens: string[],
    type: boolean,
    fromUser: string,
  ): Promise<void> {
    if (!tokens) {
      console.warn('No FCM token provided. Skipping notification.');
      return;
    }

    let title = '';
    let body = '';

    const isPublic = type === false;

    title = isPublic ? 'New Follower' : 'New Follow Request';
    body = isPublic
      ? `${fromUser} started following you`
      : `${fromUser} is requesting to follow you`;

    const messages = tokens.map((token) => ({
      token,
      notification: { title, body },
    }));

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
  }

  async createNotification(data: {
    recieverId: string;
    senderName: string;
    type: boolean;
    content: string;
    senderId: string;
    postId: string;
  }): Promise<void> {
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
        createdAt: new Date(),
      });
      await notification.save();

      console.log('Notification saved:', notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new NotificationSaveError(error.message);
    }
  }

  private async sendNotificationForFollowPrivate(
    tokens: string[],
    type: boolean,
    fromUser: string,
  ): Promise<void> {
    if (!tokens) {
      console.warn('No FCM token provided. Skipping notification.');
      return;
    }

    let title = '';
    let body = '';

    const isAccepted = type === true;

    title = isAccepted ? 'Accepted Request' : 'Rejected Request';
    body = isAccepted
      ? `${fromUser} accept your request`
      : `${fromUser} reject your request`;

    const messages = tokens.map((token) => ({
      token,
      notification: { title, body },
    }));

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
  }

  // --GRPC METHOD
  async follow(data: followRequest): Promise<SimpleUserResponse> {
    // console.log(data);
    if (!data.userId || !data.targetId) {
      return {
        message: `Invalid follow request: missing userId or targetId`,
        status: 'false',
      };
    }

    try {
      const users = await this.userSessionModel.find({
        userId: data.targetId,
        status: 'active',
      });
      if (!users) {
        throw new Error('User not found');
      }
      const tokens = users
        .map((s) => s.fcmToken)
        .filter(
          (token): token is string =>
            typeof token === 'string' && token.trim() !== '',
        );
      console.log(tokens);
      let sms = '';
      if (tokens.length > 0) {
        await this.sendNotificationForFollow(tokens, data.type, data.userId);
        if (data.type) {
          sms = `${data.userId} requesting to follow you.`;
        } else {
          sms = `${data.userId} started following you.`;
        }
        console.log(sms);
        await this.createNotification({
          recieverId: data.targetId,
          senderName: data.userName,
          type: data.type,
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
        message: `Invalid follow request: missing userId or targetId`,
        status: 'false',
      };
    }

    try {
      const users = await this.userSessionModel.find({
        userId: data.userId,
        status: 'active',
      });
      if (!users) {
        throw new Error('User not found');
      }
      const tokens = users
        .map((s) => s.fcmToken)
        .filter((token): token is string => typeof token === 'string');
      let sms = `${data.userId} rejected your request.`;
      if (tokens.length > 0) {
        await this.sendNotificationForFollowPrivate(
          tokens,
          data.type,
          data.userId,
        );
        if (data.type) {
          sms = `${data.userId} accepted your request`;
        }
        await this.createNotification({
          recieverId: data.userId,
          senderName: data.userName,
          type: data.type,
          content: ``,
          senderId: '',
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
}
