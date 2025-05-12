import { Module } from '@nestjs/common';
import { NotificationModule } from './notification/notification.module';
import * as dotenv from 'dotenv';
dotenv.config();

@Module({
  imports: [NotificationModule]
})
export class AppModule {}
