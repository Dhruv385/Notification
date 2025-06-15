export class NotificationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'NotificationError';
    }
}
  
export class FirebaseSendError extends NotificationError {
    constructor(message: string) {
      super(`Firebase Send Error: ${message}`);
      this.name = 'FirebaseSendError';
    }
}
  
export class NotificationSaveError extends NotificationError {
    constructor(message: string) {
      super(`Database Save Error: ${message}`);
      this.name = 'NotificationSaveError';
    }
}
  
export class InvalidNotificationInputError extends NotificationError {
    constructor(message: string) {
      super(`Invalid Input: ${message}`);
      this.name = 'InvalidNotificationInputError';
    }
}
  