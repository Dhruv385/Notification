import { ApiProperty } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'Notification sent successfully'
  })
  msg: string;
}

export class GetNotificationsResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'Notifications fetched successfully'
  })
  message: string;

  @ApiProperty({
    description: 'Success status',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'Array of notifications',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        recieverId: { type: 'string' },
        senderId: { type: 'string' },
        action: { type: 'string' },
        postId: { type: 'string' },
        username: { type: 'string' },
        mediaUrl: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' }
      }
    }
  })
  data: any[];
} 