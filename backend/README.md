# Permission System Backend

Policy-Based Access Control (PBAC) system built with Express.js, TypeScript, Prisma, and CASL.

## Features

- 🔐 Session-based authentication
- 🛡️ Policy-based access control with CASL
- 📊 Role and permission management
- 📝 Comprehensive audit logging
- 🔍 Permission testing and debugging tools
- 🚀 RESTful API

## Tech Stack

- **Runtime:** Node.js 20.x
- **Framework:** Express.js 4.x
- **Language:** TypeScript 5.x
- **Database:** PostgreSQL 16+ (via Prisma ORM)
- **Authorization:** CASL.js 6.x
- **Session:** express-session with PostgreSQL store
- **Validation:** Zod
- **Security:** Helmet, CORS, bcrypt

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL 16 or higher
- npm or pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your database URL and secrets

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Run migrations:
```bash
npm run prisma:migrate
```

6. Seed the database:
```bash
npm run prisma:seed
```

### Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier
- `npm run prisma:studio` - Open Prisma Studio

## Project Structure

```
src/
├── config/          # Configuration files
│   ├── database.ts  # Prisma client
│   ├── session.ts   # Session configuration
│   ├── cors.ts      # CORS configuration
│   └── env.ts       # Environment validation
├── middleware/      # Express middleware
├── services/        # Business logic services
├── controllers/     # Request handlers
├── routes/          # API routes
├── validators/      # Zod schemas
├── types/           # TypeScript types
├── utils/           # Utility functions
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

## API Documentation

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### Admin API
- `GET /admin/roles` - List roles
- `POST /admin/roles` - Create role
- `GET /admin/policies` - List policies
- `POST /admin/policies` - Create policy
- `GET /admin/permissions` - List permissions
- `GET /admin/users` - List users
- `GET /admin/audit-logs` - View audit logs
- `GET /admin/permission-matrix` - Get permission matrix
- `POST /admin/permission-test` - Test permissions

### Business API
- `GET /api/orders` - List orders (permission-filtered)
- `POST /api/orders` - Create order
- `GET /api/products` - List products
- `POST /api/products` - Create product

## Demo Accounts

After seeding, you can use these accounts:

- **Admin:** admin@example.com / password123
- **Finance:** finance@example.com / password123
- **Intern:** intern@example.com / password123

## Environment Variables

See `.env.example` for all required environment variables.

## Testing

Run unit and integration tests:
```bash
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

## License

MIT
