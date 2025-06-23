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
import { API_ENDPOINTS, DATABASE_CONSTANTS, HTTP_STATUS_CODES, SUCCESS_MESSAGES } from '../constants';

@ApiTags('Notifications')
@Controller('/notification')
export class NotificationController {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private notificationService: NotificationService,
    private grpcService:GrpcService
  ) {}

  @Post(API_ENDPOINTS.SEND_NOTIFICATION)
  @ApiOperation({ 
    summary: 'Send a notification',
    description: 'Send a notification to a user for actions like like, comment, follow, etc.'
  })
  @ApiBody({ type: SendNotificationDto })
  @ApiResponse({ 
    status: HTTP_STATUS_CODES.OK, 
    description: SUCCESS_MESSAGES.NOTIFICATION_SENT,
    type: NotificationResponseDto
  })
  @ApiResponse({ 
    status: HTTP_STATUS_CODES.BAD_REQUEST, 
    description: 'Bad request - Invalid input data' 
  })
  @ApiResponse({ 
    status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR, 
    description: 'Internal server error' 
  })
  async sendNotification(@Body() body: SendNotificationDto) {
      const { userId, action, fromUser, postId, username, mediaUrl} = body;
      try {
          await this.notificationService.sendNotification(userId, action, postId, fromUser, username, mediaUrl || '');
          return { msg: SUCCESS_MESSAGES.NOTIFICATION_SENT };
      }
      catch (err) {
          console.error(err);
          return { msg: err };
      }
  }

  @Post(API_ENDPOINTS.SEND_REPLY_NOTIFICATION)
  @ApiOperation({ 
    summary: 'Send a reply notification',
    description: 'Send a notification to a post owner when someone replies to their comment'
  })
  @ApiBody({ type: SendReplyNotificationDto })
  @ApiResponse({ 
    status: HTTP_STATUS_CODES.OK, 
    description: SUCCESS_MESSAGES.NOTIFICATION_SENT,
    type: NotificationResponseDto
  })
  @ApiResponse({ 
    status: HTTP_STATUS_CODES.BAD_REQUEST, 
    description: 'Bad request - Invalid input data' 
  })
  @ApiResponse({ 
    status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR, 
    description: 'Internal server error' 
  })
  async sendNotificationReply(@Body() body: SendReplyNotificationDto) {
      const { postOwnerId, action, postId, userId, username, parentCommentId, mediaUrl} = body;
      try {
          await this.notificationService.sendNotificationForReply(postOwnerId, action, postId, userId, username, parentCommentId, mediaUrl || '');
          return { msg: SUCCESS_MESSAGES.NOTIFICATION_SENT };
      }
      catch (err) {
          console.error(err);
          return { msg: err };
      }
  }

  @UseGuards(GrpcAuthGuard)
  @Get(API_ENDPOINTS.GET_NOTIFICATIONS)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get user notifications',
    description: 'Retrieve all notifications for the authenticated user'
  })
  @ApiResponse({ 
    status: HTTP_STATUS_CODES.OK, 
    description: SUCCESS_MESSAGES.NOTIFICATIONS_FETCHED,
    type: GetNotificationsResponseDto
  })
  @ApiResponse({ 
    status: HTTP_STATUS_CODES.UNAUTHORIZED, 
    description: 'Unauthorized - Invalid or missing token' 
  })
  @ApiResponse({ 
    status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR, 
    description: 'Internal server error' 
  })
  async send(@Req() req) {
    const userId = req.user.userId;

    const notifications = await this.notificationModel
      .find({ recieverId: userId, senderId: { $ne: null } })
      .sort(DATABASE_CONSTANTS.SORT_OPTIONS.CREATED_AT_DESC);

    return {
      message: SUCCESS_MESSAGES.NOTIFICATIONS_FETCHED,
      success: true,
      data: notifications,
    };
  }
}
