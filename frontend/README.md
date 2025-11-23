# Permission System Frontend

React + TypeScript admin UI for managing roles, policies, and permissions.

## Features

✅ **Authentication**
- Login with session-based auth
- Protected routes
- Automatic session check

✅ **Role Management**
- Create, view, update, delete roles
- View role statistics
- Real-time updates

✅ **Policy Management**
- Create and manage policies
- View policy permissions
- Assign policies to roles

✅ **User Management**
- View and manage users
- Assign roles to users
- User statistics

## Tech Stack

- **React 18** - UI library
- **TypeScript 5** - Type safety
- **Vite** - Build tool (fast HMR)
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Zustand** - State management
- **React Router** - Routing
- **Axios** - HTTP client

## Getting Started

### With Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f frontend

# Access the app
open http://localhost:5173
```

### Manual Setup

```bash
# Install dependencies
cd frontend
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn/ui components
│   │   ├── layout/      # Layout components
│   │   └── admin/       # Admin-specific components
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   └── admin/       # Admin pages
│   ├── stores/          # Zustand state stores
│   ├── services/        # API service layer
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities
│   ├── types/           # TypeScript types
│   ├── config/          # Configuration
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier

## Demo Accounts

- **Admin:** admin@example.com / password123
- **Finance:** finance@example.com / password123
- **Intern:** intern@example.com / password123

## Features Implemented

### ✅ Week 4: Foundation
- [x] Vite + React + TypeScript setup
- [x] Tailwind CSS + shadcn/ui
- [x] React Router routing
- [x] Zustand state management
- [x] Axios API client
- [x] Login page
- [x] App layout with navigation
- [x] Protected routes

### ✅ Week 5: Admin UI
- [x] Dashboard
- [x] Role management (CRUD)
- [x] Policy management (CRUD)
- [x] User management page (basic)
- [x] Responsive design

### 🚧 Week 6: Advanced Features (To Do)
- [ ] Permission Matrix visualization
- [ ] Audit Log viewer
- [ ] Permission Tester tool
- [ ] Advanced search and filtering
- [ ] Pagination controls
- [ ] Toast notifications
- [ ] Loading skeletons
- [ ] Error boundaries
- [ ] Form validation with react-hook-form
- [ ] Dark mode toggle

## Development

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation link in `src/components/layout/AppLayout.tsx`

### Adding New API Services

1. Create service in `src/services/`
2. Define types in `src/types/`
3. Create Zustand store in `src/stores/`
4. Use in components

### Adding shadcn/ui Components

shadcn/ui components are in `src/components/ui/`. To add more:

```bash
# Copy component code from shadcn/ui documentation
# Place in src/components/ui/
```

## Deployment

### Build for Production

```bash
npm run build
# Output in dist/
```

### Deploy to Vercel/Netlify

1. Connect repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variable: `VITE_API_URL=https://your-api.com`

## Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Permission Management System
```

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

MIT
