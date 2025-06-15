import { Body, Controller, Post } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { TagNotificationRequest } from "src/stubs/post";
import { PostNotifyService } from "./postNotify.service";


@Controller('/notify')
export class PostNotifyController {
    constructor(private readonly postNotifyService: PostNotifyService){}

    @GrpcMethod('notificationService', 'tagNotification')
    @Post('post/mention')
    mentionNotification(@Body() body: TagNotificationRequest){
        return this.postNotifyService.mentionNotification(body);
    }
}