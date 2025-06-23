import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { NOTIFICATION_TYPES } from '../../constants';

export class SendReplyNotificationDto {
  @ApiProperty({
    description: 'ID of the post owner receiving the notification',
    example: '507f1f77bcf86cd799439011'
  })
  @IsString()
  @IsNotEmpty()
  postOwnerId: string;

  @ApiProperty({
    description: 'Action type of the notification (should be "reply")',
    example: 'reply',
    enum: [NOTIFICATION_TYPES.REPLY]
  })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({
    description: 'ID of the post related to the notification',
    example: '507f1f77bcf86cd799439012'
  })
  @IsString()
  @IsNotEmpty()
  postId: string;

  @ApiProperty({
    description: 'ID of the user sending the notification',
    example: '507f1f77bcf86cd799439013'
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Username of the sender',
    example: 'john_doe'
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'ID of the parent comment being replied to',
    example: '507f1f77bcf86cd799439014'
  })
  @IsString()
  @IsNotEmpty()
  parentCommentId: string;

  @ApiProperty({
    description: 'URL of the media',
    example: 'https://example.com/image.jpg',
    required: false
  })
  @IsString()
  mediaUrl: string;
} 