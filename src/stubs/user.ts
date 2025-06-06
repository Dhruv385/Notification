import { Metadata } from "@grpc/grpc-js";
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";

export const protobufPackage = "user";

export interface CreateUserRequest {
  email: string;
  username: string;
  fullName: string;
  password: string;
}

export interface UserResponse {
  message: string;
  status: string;
}

export const USER_PACKAGE_NAME = "user";

export interface UserServiceClient {
  create(request: CreateUserRequest, metadata?: Metadata): Observable<UserResponse>;
}

export interface UserServiceController {
  create(
    request: CreateUserRequest,
    metadata?: Metadata,
  ): Promise<UserResponse> | Observable<UserResponse> | UserResponse;
}

export function UserServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["create"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("UserService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("UserService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const USER_SERVICE_NAME = "UserService";
