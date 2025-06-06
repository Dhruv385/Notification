import { Module } from '@nestjs/common';
import { NotificationModule } from './notification/notification.module';
import * as dotenv from 'dotenv';
import { NotificationService } from './notification/notification.service';
import { NotificationConsumer } from './kafka/notification.consumer';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
dotenv.config();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available globally
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URI'),
      }),
    }),
    NotificationModule
  ],
  providers: [NotificationConsumer]
})
export class AppModule {}
