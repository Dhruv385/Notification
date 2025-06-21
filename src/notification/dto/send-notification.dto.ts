import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SendNotificationDto {
  @ApiProperty({
    description: 'ID of the user receiving the notification',
    example: '507f1f77bcf86cd799439011'
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Action type of the notification',
    example: 'like',
    enum: ['like', 'comment', 'follow', 'reply']
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
  fromUser: string;

  @ApiProperty({
    description: 'Username of the sender',
    example: 'john_doe'
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'URL of the media',
    example: 'https://example.com/image.jpg',
    required: false
  })

  @IsString()
  mediaUrl: string;
} 