import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody 
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { GrpcAuthGuard } from 'src/guard/grpc-auth.guard';
import { InjectModel } from '@nestjs/mongoose';
import {
  NotificationDocument,
  Notification,
} from 'src/schema/notification.schema';
import { Model } from 'mongoose';
import { GrpcService } from 'src/grpc/grpc.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { SendReplyNotificationDto } from './dto/send-reply-notification.dto';
import { NotificationResponseDto, GetNotificationsResponseDto } from './dto/notification-response.dto';

@ApiTags('Notifications')
@Controller('/notification')
export class NotificationController {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private notificationService: NotificationService,
    private grpcService:GrpcService
  ) {}

  @Post('/send')
  @ApiOperation({ 
    summary: 'Send a notification',
    description: 'Send a notification to a user for actions like like, comment, follow, etc.'
  })
  @ApiBody({ type: SendNotificationDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Notification sent successfully',
    type: NotificationResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid input data' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error' 
  })
  async sendNotification(@Body() body: SendNotificationDto) {
      const { userId, action, fromUser, postId, username, mediaUrl} = body;
      try {
          await this.notificationService.sendNotification(userId, action, postId, fromUser, username, mediaUrl || '');
          return { msg: 'Notification sent successfully' };
      }
      catch (err) {
          console.error(err);
          return { msg: err };
      }
  }

  @Post('/send/reply')
  @ApiOperation({ 
    summary: 'Send a reply notification',
    description: 'Send a notification to a post owner when someone replies to their comment'
  })
  @ApiBody({ type: SendReplyNotificationDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Reply notification sent successfully',
    type: NotificationResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid input data' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error' 
  })
  async sendNotificationReply(@Body() body: SendReplyNotificationDto) {
      const { postOwnerId, action, postId, userId, username, parentCommentId, mediaUrl} = body;
      try {
          await this.notificationService.sendNotificationForReply(postOwnerId, action, postId, userId, username, parentCommentId, mediaUrl || '');
          return { msg: 'Notification sent successfully' };
      }
      catch (err) {
          console.error(err);
          return { msg: err };
      }
  }

  @UseGuards(GrpcAuthGuard)
  @Get('/')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get user notifications',
    description: 'Retrieve all notifications for the authenticated user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notifications fetched successfully',
    type: GetNotificationsResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing token' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error' 
  })
  async send(@Req() req) {
    const userId = req.user.userId;

    const notifications = await this.notificationModel
      .find({ recieverId: userId, senderId: { $ne: null } })
      .sort({ createdAt: -1 });

    return {
      message: 'Notifications fetched successfully',
      success: true,
      data: notifications,
    };
  }
}
