import { Body, Controller, Post } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { followRequest, privateFollowRequest } from "src/stubs/user";
import { UserNotifyService } from "./userNotify.service";


@Controller('/notify')
export class UserNotifyController {
    constructor(private readonly userNotifyService: UserNotifyService) {}
    
    @GrpcMethod('NotifyService', 'followRequest')
    @Post('/user/follow')
    follow(@Body() body: followRequest){
        return this.userNotifyService.follow(body);
    }

    @GrpcMethod('NotifyService', 'privateFollowRequest')
    privateFollowRequest(@Body() body: privateFollowRequest){
        return this.userNotifyService.followPrivate(body);
    }
}