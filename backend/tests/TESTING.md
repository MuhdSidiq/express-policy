# Testing Guide

## Manual Testing with cURL

### 1. Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-23T09:00:00.000Z"
}
```

### 2. Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }' \
  -c cookies.txt
```

Expected response:
```json
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "isActive": true,
    "roles": [...]
  }
}
```

### 3. Get Current User
```bash
curl http://localhost:3000/auth/me \
  -b cookies.txt
```

### 4. Logout
```bash
curl -X POST http://localhost:3000/auth/logout \
  -b cookies.txt
```

### 5. Register New User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

## Testing with Postman/Insomnia

### Setup
1. Create a new environment
2. Add variable: `BASE_URL` = `http://localhost:3000`
3. Enable cookie management (Postman does this automatically)

### Test Sequence

1. **Login**
   - Method: POST
   - URL: `{{BASE_URL}}/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "admin@example.com",
       "password": "password123"
     }
     ```

2. **Get Current User**
   - Method: GET
   - URL: `{{BASE_URL}}/auth/me`
   - (Session cookie automatically included)

3. **Logout**
   - Method: POST
   - URL: `{{BASE_URL}}/auth/logout`

## Automated Testing

### Run All Tests
```bash
cd backend
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npx vitest tests/integration/auth.test.ts
```

### Watch Mode (during development)
```bash
npx vitest --watch
```

## Test Accounts

After running `npm run prisma:seed`, these accounts are available:

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | password123 | admin |
| finance@example.com | password123 | finance |
| intern@example.com | password123 | intern |

## Expected Behaviors

### Authentication Flow
1. User logs in with email/password
2. Server validates credentials
3. Session created with userId
4. Session cookie sent to client
5. Client sends cookie with subsequent requests
6. Server validates session on each request

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Error Responses

| Status | Meaning |
|--------|---------|
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (authenticated but no permission) |
| 404 | Not Found |
| 409 | Conflict (e.g., user already exists) |
| 422 | Validation Error |
| 500 | Internal Server Error |

## Debugging Tips

### Check Session in Database
```bash
npm run prisma:studio
```
Navigate to the `sessions` table to see active sessions.

### View Logs
```bash
docker-compose logs -f backend
```

### Common Issues

1. **401 on /auth/me after login**
   - Check cookies are being sent
   - Verify CORS configuration allows credentials
   - Check SESSION_SECRET is set

2. **Session not persisting**
   - Ensure PostgreSQL is running
   - Check sessions table exists
   - Verify DATABASE_URL is correct

3. **CORS errors**
   - Add frontend URL to ALLOWED_ORIGINS in .env
   - Ensure credentials: true in CORS config
