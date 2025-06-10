import * as admin from 'firebase-admin';

type NotificationType = 'like' | 'comment';

interface NotificationPayload {
  toToken: string;
  fromUser: string;
  postTitle?: string; 
}

export function buildNotificationMessage(type: NotificationType, payload: NotificationPayload): admin.messaging.Message {
    let title = '';
    let body = '';

    switch (type) {
        case 'like':
            title = 'New Like 💖';
            body = `${payload.fromUser} liked your post${payload.postTitle ? `: "${payload.postTitle}"` : ''}.`;
            break;
        case 'comment':
            title = 'New Comment 💬';
            body = `${payload.fromUser} commented on your post${payload.postTitle ? `: "${payload.postTitle}"` : ''}.`;
            break;
    }

    return { notification: { title, body },
        data: {
        type,
        fromUser: payload.fromUser,
        ...(payload.postTitle ? { postTitle: payload.postTitle } : {}),
        },
        token: payload.toToken,
    };
}
