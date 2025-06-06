import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";

export const protobufPackage = "notification";

export interface SendGlobalNotificationRequest {
  title: string;
  body: string;
  priority: string;
  sender: string;
}

export interface SendUserNotification {
  userId: string;
  title: string;
  body: string;
  priority: string;
  sender: string;
}

export interface NotificationResponse {
  message: string;
  success: boolean;
}

export const NOTIFICATION_PACKAGE_NAME = "notification";

export interface notificationServiceClient {
  sendGlobalNotification(request: SendGlobalNotificationRequest): Observable<NotificationResponse>;

  sendUserNotification(request: SendUserNotification): Observable<NotificationResponse>;
}

export interface notificationServiceController {
  sendGlobalNotification(
    request: SendGlobalNotificationRequest,
  ): Promise<NotificationResponse> | Observable<NotificationResponse> | NotificationResponse;

  sendUserNotification(
    request: SendUserNotification,
  ): Promise<NotificationResponse> | Observable<NotificationResponse> | NotificationResponse;
}

export function notificationServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["sendGlobalNotification", "sendUserNotification"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("notificationService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("notificationService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const NOTIFICATION_SERVICE_NAME = "notificationService";
