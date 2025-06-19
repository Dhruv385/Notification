import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { GrpcAuthGuard } from 'src/guard/grpc-auth.guard';
import { InjectModel } from '@nestjs/mongoose';
import {
  NotificationDocument,
  Notification,
} from 'src/schema/notification.schema';
import { Model } from 'mongoose';
import { GrpcService } from 'src/grpc/grpc.service';

@Controller('/notification')
export class NotificationController {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private notificationService: NotificationService,
    private grpcService:GrpcService
  ) {}

  @Post('/send')
  async sendNotification(@Body() body: { userId: string; action: string; postId: string; fromUser: string; username: string; mediaUrl: string }) {
      const { userId, action, fromUser, postId, username, mediaUrl} = body;
      try {
          await this.notificationService.sendNotification(userId, action, postId, fromUser,username, mediaUrl);
          return { msg: 'Notification sent successfully' };
      }
      catch (err) {
          console.error(err);
          return { msg: err };
      }
  }

  @UseGuards(GrpcAuthGuard)
  @Get('/')
  async send(@Req() req) {
    const userId = req.user.userId;

    const notifications = await this.notificationModel.find({ recieverId: userId, senderId: { $ne: null } }).sort({ createdAt: -1 });
    const senderIds = notifications.filter((r) => typeof r.senderId === 'string' && r.senderId).map((r) => r.senderId!);
    const users = await this.grpcService.getMultipleUserNamesByIds(senderIds);

    const senderMap = new Map(
      users.map((u) => [
        u.userId,
        {
          username: u.username,
          mediaUrl: u.mediaUrl,
        },
      ]),
    );

    const enrichedNotifications = notifications.map((r) => {
      const senderInfo = r.senderId ? senderMap.get(r.senderId.toString()) : null;

      return {
        _id: r._id,
        recieverId: r.recieverId,
        senderId: r.senderId ?? null,
        senderName: r.senderName ?? senderInfo?.username ?? null,
        type: r.type,
        content: r.content,
        postId: r.postId ?? null,
        posturl: r.posturl ?? null,
        senderMediaUrl: senderInfo?.mediaUrl ?? null,
      };
    });

    return {
      message: 'Notifications fetched successfully',
      success: true,
      data: enrichedNotifications,
    };
  }

}
