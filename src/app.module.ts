import { Module } from '@nestjs/common';
import { NotificationModule } from './notification/notification.module';
import * as dotenv from 'dotenv';
import { NotificationConsumer } from './kafka/notification.consumer';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminNotifyModule } from './notification/admin/adminNotify.module';
import { UserNotifyModule } from './notification/user/userNotify.module';
import { PostNotifyModule } from './notification/post/postNotify.module';
import { GrpcAuthModule } from './guard/grpc-auth.module';
dotenv.config();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URI'),
      }),
    }),
    NotificationModule,
    AdminNotifyModule,
    UserNotifyModule,
    PostNotifyModule,
    GrpcAuthModule
  ],
  providers: [NotificationConsumer]
})
export class AppModule {}
