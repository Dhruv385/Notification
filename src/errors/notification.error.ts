import { ERROR_MESSAGES } from "src/constants";

export class NotificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotificationError';
  }
}

export class FirebaseSendError extends NotificationError {
  constructor(message: string = ERROR_MESSAGES.FIREBASE_SEND_ERROR) {
    super(`Firebase Send Error: ${message}`);
    this.name = 'FirebaseSendError';
  }
}

export class NotificationSaveError extends NotificationError {
  constructor(message: string = ERROR_MESSAGES.NOTIFICATION_SAVE_ERROR) {
    super(`Database Save Error: ${message}`);
    this.name = 'NotificationSaveError';
  }
}

export class InvalidNotificationInputError extends NotificationError {
  constructor(message: string = ERROR_MESSAGES.INVALID_INPUT_ERROR) {
    super(`Invalid Input: ${message}`);
    this.name = 'InvalidNotificationInputError';
  }
}
