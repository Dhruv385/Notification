import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { GrpcAuthGuard } from 'src/guard/grpc-auth.guard';
import { InjectModel } from '@nestjs/mongoose';
import {
  NotificationDocument,
  Notification,
} from 'src/schema/notification.schema';
import { Model } from 'mongoose';

@Controller('/notification')
export class NotificationController {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private notificationService: NotificationService
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
    const notifications = await this.notificationModel.find({ recieverId: userId }).sort({ createdAt: -1 });
    return {
      message: 'Notifications fetched successfully',
      success: true,
      data: notifications,
    };
  }
}
