# Setup Guide

## Quick Start with Docker (Recommended)

1. **Prerequisites**
   - Docker and Docker Compose installed
   - Git

2. **Clone and Start**
   ```bash
   # Navigate to project directory
   cd express-policy

   # Start all services (PostgreSQL + Backend)
   docker-compose up -d

   # Check logs
   docker-compose logs -f backend

   # The backend will automatically:
   # - Install dependencies
   # - Generate Prisma client
   # - Run database migrations
   # - Start development server on http://localhost:3000
   ```

3. **Seed Database**
   ```bash
   docker-compose exec backend npm run prisma:seed
   ```

4. **Access**
   - Backend API: http://localhost:3000
   - Health Check: http://localhost:3000/health
   - Database: localhost:5432 (postgres/postgres)

## Manual Setup (Without Docker)

1. **Prerequisites**
   - Node.js 20.x or higher
   - PostgreSQL 16 or higher
   - npm or pnpm

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Setup Database**
   ```bash
   # Create PostgreSQL database
   createdb permission_system

   # Or using psql:
   psql -U postgres
   CREATE DATABASE permission_system;
   ```

4. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

5. **Run Migrations**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

6. **Seed Database**
   ```bash
   npm run prisma:seed
   ```

7. **Start Development Server**
   ```bash
   npm run dev
   ```

## Testing the Setup

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

### 2. Test Database Connection
```bash
cd backend
npm run prisma:studio
```

This opens Prisma Studio at http://localhost:5555 where you can browse the database.

### 3. Verify Seed Data
Check that the following were created:
- 3 Roles: admin, finance, intern
- 4 Policies: FullAccess, ViewAllOrders, ManageOwnOrders, ViewProducts
- Multiple Permissions
- 3 Demo Users

## Demo Accounts

After seeding:
- **Admin:** admin@example.com / password123
- **Finance:** finance@example.com / password123
- **Intern:** intern@example.com / password123

## Project Structure

```
express-policy/
├── backend/
│   ├── src/              # Source code
│   ├── prisma/           # Database schema and migrations
│   ├── tests/            # Test files
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── docker-compose.yml    # Docker orchestration
├── README.md
└── SETUP.md             # This file
```

## Next Steps

1. ✅ Backend foundation setup complete
2. 🚧 Implement authentication system
3. 🚧 Implement CASL integration
4. 🚧 Build Admin API
5. 🚧 Build Business API
6. 🚧 Create Frontend

## Troubleshooting

### Port Already in Use
```bash
# Change PORT in .env or docker-compose.yml
# Default is 3000
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose ps
# or
pg_isready -h localhost -p 5432

# View backend logs
docker-compose logs backend
```

### Prisma Issues
```bash
# Regenerate Prisma client
npm run prisma:generate

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

## Development Workflow

1. Make code changes
2. Hot reload automatically applies changes (in Docker)
3. Run tests: `npm test`
4. Check linting: `npm run lint`
5. Format code: `npm run format`

## Production Deployment

See deployment guide in the main README for production setup instructions.
