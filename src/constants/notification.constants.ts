export const NOTIFICATION_TYPES = {
  LIKE: 'like',
  COMMENT: 'comment',
  REPLY: 'reply',
  FOLLOW: 'follow',
  UNFOLLOW: 'unfollow',
  SHARE: 'share',
  MENTION: 'mention',
  POST: 'post',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

export const NOTIFICATION_MESSAGES = {
  LIKE: (username: string) => `${username} liked your post`,
  COMMENT: (username: string) => `${username} commented on your post`,
  REPLY: (username: string) => `${username} replied to your comment`,
  FOLLOW: (username: string) => `${username} started following you`,
  UNFOLLOW: (username: string) => `${username} unfollowed you`,
  SHARE: (username: string) => `${username} shared your post`,
  MENTION: (username: string) => `${username} mentioned you in a comment`,
  POST: (username: string) => `${username} posted something new`,
  DEFAULT: 'You have a new notification.',
} as const;


export const FIREBASE_CONFIG = {
  SERVICE_ACCOUNT_PATH: '/home/user/Assignment/social_media/Notification/firebase.json',
  MESSAGING_DEFAULT_OPTIONS: {
    priority: 'high',
    timeToLive: 60 * 60 * 24, // 24 hours
  },
} as const;


export const API_ENDPOINTS = {
  SEND_NOTIFICATION: '/notification/send',
  SEND_REPLY_NOTIFICATION: '/notification/send/reply',
  GET_NOTIFICATIONS: '/notification/',
} as const;


export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;


export const ERROR_MESSAGES = {
  FIREBASE_SEND_ERROR: 'Failed to send notification via Firebase',
  NOTIFICATION_SAVE_ERROR: 'Failed to save notification to database',
  INVALID_INPUT_ERROR: 'Invalid notification input data',
  USER_NOT_FOUND: 'User not found or no active session',
  MISSING_FCM_TOKEN: 'User has no FCM token registered',
  INVALID_NOTIFICATION_TYPE: 'Invalid notification type provided',
  MISSING_REQUIRED_FIELDS: 'Missing required fields for notification',
} as const;


export const SUCCESS_MESSAGES = {
  NOTIFICATION_SENT: 'Notification sent successfully',
  NOTIFICATION_SAVED: 'Notification saved successfully',
  NOTIFICATIONS_FETCHED: 'Notifications fetched successfully',
} as const;


export const DATABASE_CONSTANTS = {
  USER_SESSION_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    EXPIRED: 'expired',
  },
  SORT_OPTIONS: {
    CREATED_AT_DESC: { createdAt: -1 },
    CREATED_AT_ASC: { createdAt: 1 },
  },
} as const;


export const VALIDATION_CONSTANTS = {
  MAX_USERNAME_LENGTH: 50,
  MAX_CONTENT_LENGTH: 500,
  MIN_USERNAME_LENGTH: 3,
  MAX_POST_ID_LENGTH: 100,
  MAX_USER_ID_LENGTH: 100,
} as const;


export const NOTIFICATION_PRIORITY = {
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
} as const;


export const NOTIFICATION_CATEGORIES = {
  SOCIAL: 'social',
  SYSTEM: 'system',
  SECURITY: 'security',
  MARKETING: 'marketing',
} as const;


export const RATE_LIMIT_CONSTANTS = {
  MAX_NOTIFICATIONS_PER_MINUTE: 10,
  MAX_NOTIFICATIONS_PER_HOUR: 100,
  MAX_NOTIFICATIONS_PER_DAY: 1000,
} as const;


export const CACHE_CONSTANTS = {
  NOTIFICATION_CACHE_TTL: 300, // 5 minutes
  USER_SESSION_CACHE_TTL: 3600, // 1 hour
  NOTIFICATION_LIST_CACHE_TTL: 600, // 10 minutes
} as const;


export const LOG_CONSTANTS = {
  LOG_LEVELS: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
  },
  LOG_PREFIXES: {
    NOTIFICATION_SERVICE: '[NotificationService]',
    NOTIFICATION_CONTROLLER: '[NotificationController]',
    FIREBASE: '[Firebase]',
    DATABASE: '[Database]',
  },
} as const;


export const ENV_VARIABLES = {
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
  MONGODB_URI: 'MONGODB_URI',
  FIREBASE_PROJECT_ID: 'FIREBASE_PROJECT_ID',
  FIREBASE_PRIVATE_KEY: 'FIREBASE_PRIVATE_KEY',
  FIREBASE_CLIENT_EMAIL: 'FIREBASE_CLIENT_EMAIL',
} as const;


export const DEFAULT_VALUES = {
  NOTIFICATION_TTL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  BATCH_SIZE: 100,
  PAGINATION_LIMIT: 20,
} as const;


export const NOTIFICATION_TEMPLATES = {
  WELCOME: 'welcome_notification',
  POST_INTERACTION: 'post_interaction',
  FOLLOW: 'follow_notification',
  MENTION: 'mention_notification',
  SYSTEM_UPDATE: 'system_update',
} as const;

export const FEATURE_FLAGS = {
  ENABLE_PUSH_NOTIFICATIONS: 'ENABLE_PUSH_NOTIFICATIONS',
  ENABLE_EMAIL_NOTIFICATIONS: 'ENABLE_EMAIL_NOTIFICATIONS',
  ENABLE_SMS_NOTIFICATIONS: 'ENABLE_SMS_NOTIFICATIONS',
  ENABLE_NOTIFICATION_GROUPING: 'ENABLE_NOTIFICATION_GROUPING',
  ENABLE_NOTIFICATION_SCHEDULING: 'ENABLE_NOTIFICATION_SCHEDULING',
} as const; 