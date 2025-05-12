import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { buildNotificationMessage } from './utilis/notification.utilis';

@Injectable()
export class NotificationService {
    constructor(){
        const serviceAccount = require('/home/user/Assignment/task/src/notification/firebase_key.json');

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        }
    }

    async sendNotification(token: string, action : any): Promise<void>{
      
        const notifications = [
          buildNotificationMessage(action, {
            toToken: token,
            fromUser: 'Dhruv',
            postTitle: 'My Summer Trip',
          }),
        ];
      
        for (const message of notifications) {
          try {
            const res = await admin.messaging().send(message);
            console.log(`✅ ${message.notification?.title} sent:`, res);
          } catch (err) {
            console.error(`❌ Error sending ${message.notification?.title}:`, err);
          }
        }
      }
}
