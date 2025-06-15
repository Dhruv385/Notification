import { Body, Controller, Post } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { CreateUserRequest, FollowRequest } from "src/stubs/user";
import { UserNotifyService } from "./userNotify.service";


@Controller('/notify')
export class UserNotifyController {
    constructor(private readonly userNotifyService: UserNotifyService) {}

    @GrpcMethod('notificationService', 'createUserNotification')
    @Post('user/create')
    createUser(@Body() body: CreateUserRequest){
        return this.userNotifyService.create(body);
    }
    
    @GrpcMethod('notificationService', 'follow')
    @Post('/user/follow')
    follow(@Body() body: FollowRequest){
        return this.userNotifyService.follow(body);
    }
}