# Notification Service Constants

This directory contains all the constants used throughout the notification service.

## File Structure

- `notification.constants.ts` - Main constants file containing all notification-related constants
- `index.ts` - Index file for easy importing of all constants

## Usage

### Importing Constants

```typescript
// Import specific constants
import { NOTIFICATION_TYPES, ERROR_MESSAGES } from '../constants/notification.constants';

// Import all constants
import * as Constants from '../constants';

// Import from index file
import { NOTIFICATION_TYPES, SUCCESS_MESSAGES } from '../constants';
```

### Available Constants

#### Notification Types
```typescript
import { NOTIFICATION_TYPES } from '../constants';

// Usage
const notificationType = NOTIFICATION_TYPES.LIKE; // 'like'
const isComment = action === NOTIFICATION_TYPES.COMMENT;
```

#### Notification Messages
```typescript
import { NOTIFICATION_MESSAGES } from '../constants';

// Usage
const message = NOTIFICATION_MESSAGES.LIKE('John Doe'); // 'John Doe liked your post'
const defaultMessage = NOTIFICATION_MESSAGES.DEFAULT; // 'You have a new notification.'
```

#### Error Messages
```typescript
import { ERROR_MESSAGES } from '../constants';

// Usage
throw new Error(ERROR_MESSAGES.FIREBASE_SEND_ERROR);
```

#### Success Messages
```typescript
import { SUCCESS_MESSAGES } from '../constants';

// Usage
return { message: SUCCESS_MESSAGES.NOTIFICATION_SENT };
```

#### HTTP Status Codes
```typescript
import { HTTP_STATUS_CODES } from '../constants';

// Usage
res.status(HTTP_STATUS_CODES.OK).json(data);
```

#### Database Constants
```typescript
import { DATABASE_CONSTANTS } from '../constants';

// Usage
const activeUsers = await userModel.find({ 
  status: DATABASE_CONSTANTS.USER_SESSION_STATUS.ACTIVE 
});
```

#### Validation Constants
```typescript
import { VALIDATION_CONSTANTS } from '../constants';

// Usage
if (username.length > VALIDATION_CONSTANTS.MAX_USERNAME_LENGTH) {
  throw new Error('Username too long');
}
```

## Constants Categories

### 1. Notification Types (`NOTIFICATION_TYPES`)
Defines all possible notification actions/types:
- `LIKE`, `COMMENT`, `REPLY`, `FOLLOW`, `UNFOLLOW`, `SHARE`, `MENTION`, `POST`

### 2. Notification Messages (`NOTIFICATION_MESSAGES`)
Template functions for generating notification messages based on action type.

### 3. Firebase Configuration (`FIREBASE_CONFIG`)
Firebase-related configuration constants including service account path and messaging options.

### 4. API Endpoints (`API_ENDPOINTS`)
All notification service API endpoint paths.

### 5. HTTP Status Codes (`HTTP_STATUS_CODES`)
Common HTTP status codes used in the service.

### 6. Error Messages (`ERROR_MESSAGES`)
Standardized error messages for different error scenarios.

### 7. Success Messages (`SUCCESS_MESSAGES`)
Standardized success messages for API responses.

### 8. Database Constants (`DATABASE_CONSTANTS`)
Database-related constants like user session statuses and sort options.

### 9. Validation Constants (`VALIDATION_CONSTANTS`)
Input validation limits and constraints.

### 10. Notification Priority (`NOTIFICATION_PRIORITY`)
Priority levels for notifications: `HIGH`, `NORMAL`, `LOW`.

### 11. Notification Categories (`NOTIFICATION_CATEGORIES`)
Categories for organizing notifications: `SOCIAL`, `SYSTEM`, `SECURITY`, `MARKETING`.

### 12. Rate Limiting (`RATE_LIMIT_CONSTANTS`)
Rate limiting thresholds for notification sending.

### 13. Cache Constants (`CACHE_CONSTANTS`)
Cache TTL values for different data types.

### 14. Logging Constants (`LOG_CONSTANTS`)
Log levels and prefixes for consistent logging.

### 15. Environment Variables (`ENV_VARIABLES`)
Names of environment variables used by the service.

### 16. Default Values (`DEFAULT_VALUES`)
Default configuration values for various settings.

### 17. Notification Templates (`NOTIFICATION_TEMPLATES`)
Template IDs for future notification template system.

### 18. Feature Flags (`FEATURE_FLAGS`)
Feature flag names for enabling/disabling features.

## Best Practices

1. **Always use constants instead of magic strings/numbers**
   ```typescript
   // Good
   if (action === NOTIFICATION_TYPES.LIKE) { ... }
   
   // Bad
   if (action === 'like') { ... }
   ```

2. **Use the message templates for consistent notification text**
   ```typescript
   // Good
   const message = NOTIFICATION_MESSAGES.LIKE(username);
   
   // Bad
   const message = `${username} liked your post`;
   ```

3. **Use error messages for consistent error handling**
   ```typescript
   // Good
   throw new FirebaseSendError(ERROR_MESSAGES.FIREBASE_SEND_ERROR);
   
   // Bad
   throw new Error('Failed to send notification');
   ```

4. **Use status codes for consistent HTTP responses**
   ```typescript
   // Good
   res.status(HTTP_STATUS_CODES.OK).json(data);
   
   // Bad
   res.status(200).json(data);
   ```

## Adding New Constants

When adding new constants:

1. Add them to the appropriate section in `notification.constants.ts`
2. Use `as const` for type safety
3. Add JSDoc comments for complex constants
4. Update this README if adding new categories
5. Consider adding TypeScript types for complex constants

## Type Safety

All constants are defined with `as const` to ensure type safety:

```typescript
export const NOTIFICATION_TYPES = {
  LIKE: 'like',
  COMMENT: 'comment',
} as const;

// This provides type safety
export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];
``` 