// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v2.7.1
//   protoc               v3.21.12
// source: post.proto

/* eslint-disable */
import { Metadata } from "@grpc/grpc-js";
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";

export const protobufPackage = "post";

export interface CreatePostRequest {
  postOwnerId: string;
  postId: string;
}

export interface DeletePostRequest {
  postOwnerId: string;
  postId: string;
}

export interface PostResponse {
  message: string;
  success: boolean;
}

export const POST_PACKAGE_NAME = "post";

export interface postServiceClient {
  createPost(request: CreatePostRequest, metadata?: Metadata): Observable<PostResponse>;

  deletePost(request: DeletePostRequest, metadata?: Metadata): Observable<PostResponse>;
}

export interface postServiceController {
  createPost(
    request: CreatePostRequest,
    metadata?: Metadata,
  ): Promise<PostResponse> | Observable<PostResponse> | PostResponse;

  deletePost(
    request: DeletePostRequest,
    metadata?: Metadata,
  ): Promise<PostResponse> | Observable<PostResponse> | PostResponse;
}

export function postServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ["createPost", "deletePost"];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("postService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("postService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const POST_SERVICE_NAME = "postService";
