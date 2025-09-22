# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Telnet-printer is a Node.js web application that provides a secure interface for sending print commands to network printers via Telnet protocol. The application features user authentication, role-based access control, and a web-based interface for generating and sending various barcode and text commands to thermal printers.

## Architecture

### Backend Structure
- **server.js**: Main application entry point that sets up Express server, middleware, and route handling
- **router.js**: Core API router containing authentication, JWT management, and Telnet communication logic
- **db.js**: MySQL connection pool configuration and database abstraction
- **auth/auth.js**: Authentication middleware for JWT token verification

### Frontend Structure
- **printer/public/**: Main printer interface with HTML/CSS/JS for sending commands
- **login/frontend/**: User authentication interface
- **register/frontend/**: User registration interface  
- **admin/**: Administrative interface for user management (backend/frontend separation)

### Key Components
1. **Authentication System**: JWT-based with access/refresh tokens, cookie-based session management
2. **Telnet Client**: Uses `telnet-client` library for printer communication with IP validation and local network restrictions
3. **Database Layer**: MySQL with connection pooling for user management and session storage
4. **Security Features**: Input sanitization, IP filtering (local networks only), rate limiting ready

### Data Flow
1. User authenticates via login interface → JWT tokens stored
2. Main interface loads with authentication check
3. User configures print parameters via dynamic form (loaded from `opzioni.json`)
4. Commands sent to `/api/send-command` endpoint with authentication
5. Backend validates input, establishes Telnet connection, sends command to printer
6. Response logged in UI with detailed error handling

## Development Commands

### Local Development
```bash
# Install dependencies
npm install

# Start development server
node server.js
```

### Docker Development
```bash
# Build and run with Docker Compose (includes MySQL)
docker compose up --build

# Access application
# http://localhost:3001
```

### Database Setup
The application expects a MySQL database. Connection configured via environment variables:
- `DB_HOST` (default: localhost)
- `DB_USER` (default: root) 
- `DB_PASSWORD`
- `DB_NAME` (default: telnet_printer_db)

### Environment Variables
Required environment variables (see `.env` file):
- `JWT_SECRET`: Secret for JWT token signing
- `REFRESH_SECRET`: Secret for refresh token signing  
- `DB_*`: Database connection parameters
- `PORT` (default: 3001)

## Key Files and Patterns

### Configuration Files
- **opzioni.json**: Printer command configurations and parameter definitions
- **compose.yaml**: Docker Compose setup with MySQL service
- **Dockerfile**: Node.js container configuration

### Security Patterns
- All API routes under `/api` require authentication via `authMiddleware`
- IP addresses restricted to local networks only (`isLocalIP` function)
- Input sanitization for all user inputs before Telnet commands
- SQL injection protection via parameterized queries

### Frontend Patterns
- Authentication state management via localStorage
- Dynamic form generation based on JSON configuration
- Real-time logging and error display
- Role-based UI element visibility (admin features)

## Development Notes

### Telnet Communication
- Commands are built using `buildCmdString()` function with parameter validation
- Connection timeout set to 10 seconds with detailed error messages
- Supports various printer command types loaded from `opzioni.json`

### Authentication Flow
- Login creates access token (15min) and refresh token (7d)
- Frontend checks token validity on page load
- Automatic redirect to login on authentication failure
- Cookie-based session management with httpOnly cookies

### Database Schema
The application expects a `users` table with at minimum:
- `id`, `email`, `password` (bcrypt hashed), `role` fields
- Password hashing handled via bcrypt with proper salt rounds

### Error Handling
- Detailed error messages for connection failures (timeout, refused, unreachable)
- Client-side validation with server-side confirmation
- Proper cleanup of Telnet connections in finally blocks