import { Body, Controller, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SendGlobalNotificationRequest, SendUserNotification } from 'src/stubs/notify';
import { CreateUserRequest, FollowRequest } from 'src/stubs/user';
import { GrpcMethod } from '@nestjs/microservices';
import { SendPostNotificationRequest, SendPostNotificationResponse } from 'src/stubs/post';

@Controller('/notification')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}

    @Post('/send')
    async sendNotification(@Body('token') token: string){
        try{
            await this.notificationService.sendNotification(token, "comment");  
            return {msg: 'Notification send successfully'};
        }
        catch(err){
            console.error(err);
            return {msg: err};
        }
    }

    // Admin Controller
    @GrpcMethod('NotificationService', 'sendGlobal')
    sendGlobal(@Body() body: SendGlobalNotificationRequest) {
        return this.notificationService.sendGlobalNotification(body);
    }

    @GrpcMethod('NotificationService', 'sendUser')
    sendUser(@Body() body: SendUserNotification) {
        return this.notificationService.sendUserNotification(body);
    }


    // User controller
    @GrpcMethod('NotificationService', 'createUser')
    createUser(@Body() body: CreateUserRequest){
        return this.notificationService.create(body);
    }

    @GrpcMethod('NotificationService', 'follow')
    follow(@Body() body: FollowRequest){
        return this.notificationService.follow(body);
    }

    // Post Controller
    @GrpcMethod('NotificationService', 'SendPostNotification')
    sendPostNotification(data: SendPostNotificationRequest): Promise<SendPostNotificationResponse> {
        return this.notificationService.sendPostNotification(data);
    }
}
