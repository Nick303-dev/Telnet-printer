# Router System Reorganization

## Overview

The router system has been completely reorganized to eliminate duplications and improve maintainability. The new structure follows a modular approach with clear separation of concerns.

## New Structure

### Core Modules

#### `utils/index.js`
Centralized utility functions:
- **JWT Functions**: `generateAccessToken`, `generateRefreshToken`, `verifyAccessToken`, `verifyRefreshToken`
- **Validation Functions**: `sanitizeInput`, `isValidIP`, `isValidPort`, `isLocalIP`, `isValidEmail`
- **Password Functions**: `generateRandomPassword`
- **Telnet Functions**: `buildCmdString`

#### `middleware/auth.js`
Standardized authentication middleware:
- **`authMiddleware`**: Handles token authentication from multiple sources (Bearer header, body, query, cookies)
- **`adminOnly`**: Requires admin role for access

### Route Modules

#### `routes/auth.js`
Authentication endpoints:
- `POST /login` - User login
- `POST /refresh` - Token refresh
- `GET /verify-token` - Token validation
- `POST /logout` - User logout

#### `routes/admin.js`
Admin-only user management:
- `GET /users` - List all users
- `POST /users` - Create new user
- `PUT /users/:id` - Update user status/role
- `POST /users/:id/reset-password` - Reset user password

#### `routes/profile.js`
Current user profile management:
- `GET /` - Get current user profile
- `POST /change-password` - Change current user password

#### `routes/telnet.js`
Telnet/printer operations:
- `POST /send-command` - Send commands to printer
- `GET /printer-data` - Get printer status data

#### `routes/index.js`
Main router that consolidates all modules with proper path organization:

```
/auth/*          - Authentication endpoints
/admin/*         - Admin-only endpoints
/profile/*       - User profile endpoints
/printer/*       - Printer/telnet endpoints

Legacy compatibility:
/api/*           - Backwards compatibility paths
/login           - Direct login endpoint
/verify-token    - Direct token verification
/logout          - Direct logout endpoint
```

## API Endpoints Summary

### Authentication (`/auth/*` or `/api/*`)
- `POST /auth/login` or `POST /login`
- `POST /auth/refresh` or `POST /api/refresh`
- `GET /auth/verify-token` or `GET /verify-token`
- `POST /auth/logout` or `POST /logout`

### Admin (`/admin/*` or `/api/admin/*`)
- `GET /admin/users`
- `POST /admin/users`
- `PUT /admin/users/:id`
- `POST /admin/users/:id/reset-password`

### Profile (`/profile/*` or `/api/profile/*`)
- `GET /profile`
- `POST /profile/change-password`

### Printer/Telnet (`/printer/*` or `/api/printer/*`)
- `POST /printer/send-command` or `POST /api/send-command` (legacy)
- `GET /printer/printer-data`

## Key Improvements

### ✅ Eliminated Duplications
- **Removed duplicate JWT functions** across 3+ files
- **Removed duplicate validation functions** (sanitizeInput, isValidIP, etc.)
- **Consolidated authentication middleware** with standardized token handling
- **Merged overlapping router functionality** from multiple files

### ✅ Better Organization
- **Modular structure** with clear separation by functionality
- **Consistent error handling** and response formats
- **Standardized middleware** application
- **Clear routing hierarchy** with proper prefixes

### ✅ Maintained Compatibility
- **Legacy endpoints** still work for backward compatibility
- **Multiple token sources** supported (Bearer header, body, query, cookies)
- **Consistent response format** across all endpoints

### ✅ Enhanced Security
- **Centralized validation** functions
- **Standardized input sanitization**
- **Consistent authentication flow**

## Migration Notes

### Old Files (Backed up)
- `router.js` → `router.js.bak`
- `auth/auth.js` → `auth/auth.js.bak`
- `login/backend/route/router.js` (contains duplicated functionality)
- `admin/backend/router.js` (contains duplicated functionality)

### New Entry Point
The main server now uses `routes/index.js` as the single entry point for all routing.

### Environment Variables Required
- `JWT_SECRET` - For access tokens
- `REFRESH_SECRET` - For refresh tokens

## Testing

Test key endpoints to ensure everything works:

```bash
# Health check
GET /health

# Login
POST /login
POST /auth/login

# Admin functions
GET /admin/users
POST /admin/users

# Profile
GET /profile

# Printer
POST /printer/send-command
POST /api/send-command  # Legacy
```

## Future Improvements

1. **Rate limiting** per endpoint type
2. **API versioning** (e.g., `/v1/auth/*`)
3. **Request validation middleware** using schemas
4. **Comprehensive logging middleware**
5. **API documentation** generation (OpenAPI/Swagger)