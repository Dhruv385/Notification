import { Body, Controller, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';

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

}
