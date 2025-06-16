import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { GrpcAuthGuard } from 'src/guard/grpc-auth.guard';
import { InjectModel } from '@nestjs/mongoose';
import { NotificationDocument, Notification } from 'src/schema/notification.schema';
import { Model } from 'mongoose';

@Controller('/notification')
export class NotificationController {
    constructor(@InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>) {}

    // @Post('/send')
    // async sendNotification(@Body() body: { token: string; action: string; postId?: string; fromUser?: string; }) {
    //     const { token, action, fromUser, postId } = body;
    //     try {
    //         await this.notificationService.sendNotification(token, action, postId, fromUser);
    //         return { msg: 'Notification sent successfully' };
    //     } 
    //     catch (err) {
    //         console.error(err);
    //         return { msg: err };
    //     }
    // }

    @UseGuards(GrpcAuthGuard)
    @Get('/')
    async send(@Req() req){
        const userId = req.user.userId;
        return await this.notificationModel.find({recieverId: userId});
    }
}
