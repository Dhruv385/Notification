import { Body, Controller, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SendGlobalNotificationRequest, SendUserNotification } from 'src/stubs/notify';
import { CreateUserRequest } from 'src/stubs/user';
import { CreatePostRequest, DeletePostRequest } from 'src/stubs/post';

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
    @Post('/global')
    sendGlobal(@Body() body: SendGlobalNotificationRequest) {
        return this.notificationService.sendGlobalNotification(body);
    }

    @Post('/user')
    sendUser(@Body() body: SendUserNotification) {
        return this.notificationService.sendUserNotification(body);
    }


    // User controller
    @Post('/user/create')
    createUser(@Body() body: CreateUserRequest){
        return this.notificationService.create(body);
    }


    // Post Controller
    @Post('/post/create')
    CreatePost(@Body() body: CreatePostRequest){
        return this.notificationService.createPost(body);
    }

    @Post('/post/delete')
    DeletePost(@Body() body: DeletePostRequest){
        return this.notificationService.DeletePost(body);
    }
}
