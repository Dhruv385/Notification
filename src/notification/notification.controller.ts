import { Body, Controller, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SendGlobalNotificationRequest, SendUserNotification } from 'src/stubs/admin';
import { CreateUserRequest, FollowRequest } from 'src/stubs/user';
import { GrpcMethod } from '@nestjs/microservices';
import { TagNotificationRequest } from 'src/stubs/post';

@Controller('/notification')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}

    @Post('/send')
    async sendNotification(@Body() body: { token: string; action: string; postId?: string; fromUser?: string; }) {
        const { token, action, fromUser, postId } = body;
        try {
            await this.notificationService.sendNotification(token, action, postId, fromUser);
            return { msg: 'Notification sent successfully' };
        } 
        catch (err) {
            console.error(err);
            return { msg: err };
        }
    }

    // Admin Controller
    @GrpcMethod('NotificationService', 'sendGlobal')
    @Post('/admin/global')
    sendGlobal(@Body() body: SendGlobalNotificationRequest) {
        return this.notificationService.sendGlobalNotification(body);
    }

    @GrpcMethod('NotificationService', 'sendUser')
    @Post('/admin/user')
    sendUser(@Body() body: SendUserNotification) {
        return this.notificationService.sendUserNotification(body);
    }


    // User controller
    @GrpcMethod('NotificationService', 'createUser')
    @Post('user/create')
    createUser(@Body() body: CreateUserRequest){
        return this.notificationService.create(body);
    }

    @GrpcMethod('NotificationService', 'follow')
    @Post('/user/follow')
    follow(@Body() body: FollowRequest){
        return this.notificationService.follow(body);
    }

    // Post Controller
    @GrpcMethod('NotificationService', 'mentionNotification')
    @Post('post/mention')
    mentionNotification(@Body() body: TagNotificationRequest){
        return this.notificationService.mentionNotification(body);
    }

}
