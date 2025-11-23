# Technical Specification: Policy-Based Permission Management System

**Version:** 1.0  
**Date:** November 23, 2025  
**Project Timeline:** 6 Weeks  
**Status:** Planning Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Business Requirements](#business-requirements)
3. [System Architecture](#system-architecture)
4. [Technology Stack](#technology-stack)
5. [Database Design](#database-design)
6. [Backend Architecture](#backend-architecture)
7. [Frontend Architecture](#frontend-architecture)
8. [Security Considerations](#security-considerations)
9. [API Specification](#api-specification)
10. [Implementation Plan](#implementation-plan)
11. [Testing Strategy](#testing-strategy)
12. [Deployment Strategy](#deployment-strategy)
13. [Risk Assessment](#risk-assessment)
14. [Success Metrics](#success-metrics)

---

## Executive Summary

### Project Overview

This project aims to build a custom **Policy-Based Access Control (PBAC)** system to replace Directus, providing a lightweight, maintainable solution for managing user permissions across a business application. The system will support granular permission management through a flexible policy engine while maintaining a clean, minimal database schema.

### Key Objectives

1. **Replace Directus** with a custom solution to reduce unnecessary overhead
2. **Implement flexible PBAC** using CASL.js for attribute-based permissions
3. **Provide intuitive Admin UI** for non-technical users to manage permissions
4. **Maintain audit trail** for all permission changes
5. **Support scalability** for future business entities and roles

### Core Capabilities

- **Policy-Based Permissions**: Users inherit permissions through roles and policies
- **Conditional Access**: Support for ownership-based rules (e.g., "manage own orders")
- **Field-Level Security**: Control access to specific fields within resources
- **Real-Time Testing**: Built-in permission tester for debugging
- **Audit Logging**: Complete history of permission changes
- **User-Friendly UI**: Visual permission matrix and policy builder

---

## Business Requirements

### Functional Requirements

#### FR-1: Role Management
- System shall support creation, modification, and deletion of roles
- Roles: Admin, Finance, Intern (extensible)
- Roles can have multiple policies attached
- Users can have multiple roles (additive permissions)

#### FR-2: Policy Management
- Policies are named collections of permissions
- Policies are reusable across multiple roles
- Support for CRUD operations on policies
- Policies can be activated/deactivated without deletion

#### FR-3: Permission Management
- Permissions define: Action + Resource + Conditions + Fields
- Actions: create, read, update, delete, manage (all actions)
- Resources: User, Order, Product (extensible)
- Conditions: JSON-based rules (e.g., `{ userId: "{{currentUser.id}}" }`)
- Field-level restrictions: Specify accessible fields per permission

#### FR-4: User Management
- Assign/revoke roles to users
- View effective permissions for any user
- Deactivate users without deleting data
- Support for user creation with initial role assignment

#### FR-5: Permission Matrix View
- Visual grid showing Role × Resource × Action
- Quick toggle permissions on/off
- Filter by role or resource
- Export matrix to CSV

#### FR-6: Audit Logging
- Log all permission-related changes
- Track: who, what, when, before/after state
- Searchable and filterable audit logs
- Retention policy: 90 days minimum

#### FR-7: Permission Testing Tool
- Select user, action, resource
- Test permission in real-time
- Display which policies granted/denied access
- Show applied conditions and field restrictions

#### FR-8: Session Management
- Session-based authentication (like Directus)
- Secure session storage in PostgreSQL
- Configurable session timeout
- Support for session revocation

### Non-Functional Requirements

#### NFR-1: Performance
- Permission checks: < 50ms response time
- Admin UI page load: < 2 seconds
- Support 1000+ concurrent users
- Database queries optimized with proper indexing

#### NFR-2: Security
- All passwords hashed with bcrypt (cost factor 12)
- Session tokens cryptographically secure
- HTTPS required in production
- CORS properly configured
- SQL injection prevention (Prisma ORM)
- XSS protection (sanitized inputs)

#### NFR-3: Scalability
- Horizontal scaling capability
- Stateless API design (session in DB)
- Database connection pooling
- Redis caching for permission rules (future)

#### NFR-4: Maintainability
- TypeScript for type safety
- Comprehensive code documentation
- Consistent code style (ESLint + Prettier)
- Modular architecture
- < 15% code duplication

#### NFR-5: Usability
- Admin UI responsive (mobile, tablet, desktop)
- Accessible (WCAG 2.1 Level AA)
- Loading states for all async operations
- Clear error messages
- Confirmation dialogs for destructive actions

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                         │
│                    (React + Vite SPA)                       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         │ REST API
┌────────────────────────▼────────────────────────────────────┐
│                   Express.js Backend                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Middleware Layer                                     │   │
│  │  - CORS, Helmet, Body Parser                        │   │
│  │  - Session Management (express-session)             │   │
│  │  - Authentication Guard                              │   │
│  │  - CASL Ability Attachment                          │   │
│  │  - Audit Logging                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Services Layer                                       │   │
│  │  - Ability Builder (CASL)                           │   │
│  │  - Policy Engine                                     │   │
│  │  - Audit Service                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Controllers Layer                                    │   │
│  │  - Auth Controller                                   │   │
│  │  - Admin Controllers (Roles, Policies, Users)       │   │
│  │  - Business Controllers (Orders, Products)          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Data Access Layer (Prisma ORM)                      │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   PostgreSQL Database                       │
│  - users, sessions                                          │
│  - roles, policies, permissions                             │
│  - products, orders                                         │
│  - audit_logs                                               │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Request Flow:
1. User clicks "Create Order" in UI
2. Frontend sends POST /api/orders with session cookie
3. Express session middleware validates session
4. attachAbility middleware builds user's CASL ability from policies
5. Controller checks: req.ability.can('create', 'Order')
6. If authorized: Create order via Prisma
7. Audit middleware logs the action
8. Response sent to client

Permission Update Flow:
1. Admin updates policy in UI
2. Frontend sends PUT /admin/policies/:id
3. Backend validates admin permissions
4. Update policy in database
5. Clear permission cache for affected roles
6. Log change in audit_logs
7. Return updated policy to client
```

---

## Technology Stack

### Backend Stack

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| **Node.js** | 20.x LTS | Runtime | Stable, excellent ecosystem |
| **Express.js** | 4.18+ | Web Framework | Battle-tested, middleware ecosystem |
| **TypeScript** | 5.3+ | Language | Type safety, better DX |
| **Prisma** | 5.7+ | ORM | Type-safe queries, migrations, PostgreSQL support |
| **PostgreSQL** | 16+ | Database | ACID compliance, JSON support, performance |
| **@casl/ability** | 6.5+ | Authorization | Flexible PBAC, condition support |
| **express-session** | 1.17+ | Session Management | Mature, widely adopted |
| **connect-pg-simple** | 9.0+ | Session Store | PostgreSQL session persistence |
| **bcrypt** | 5.1+ | Password Hashing | Industry standard, secure |
| **zod** | 3.22+ | Validation | Type-safe schema validation |
| **helmet** | 7.1+ | Security | HTTP security headers |
| **cors** | 2.8+ | CORS | Cross-origin configuration |

### Frontend Stack

| Technology | Version | Purpose | Justification |
|------------|---------|---------|---------------|
| **React** | 18.2+ | UI Library | Component-based, large ecosystem |
| **Vite** | 5.0+ | Build Tool | Fast HMR, optimized builds |
| **TypeScript** | 5.3+ | Language | Type safety, IntelliSense |
| **Zustand** | 4.4+ | State Management | Simple, performant, no boilerplate |
| **React Router** | 6.20+ | Routing | Standard React routing |
| **Tailwind CSS** | 3.4+ | Styling | Utility-first, consistent design |
| **shadcn/ui** | Latest | Component Library | Accessible, customizable, Radix UI based |
| **Axios** | 1.6+ | HTTP Client | Interceptors, request cancellation |
| **React Hook Form** | 7.48+ | Form Management | Performance, validation integration |
| **date-fns** | 2.30+ | Date Utilities | Modern, tree-shakeable |
| **Lucide React** | Latest | Icons | Consistent icon set |

### DevOps & Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **Docker** | 24+ | Containerization |
| **Docker Compose** | 2.23+ | Multi-container orchestration |
| **pnpm** | 8+ | Package manager (faster than npm) |
| **ESLint** | 8+ | Code linting |
| **Prettier** | 3+ | Code formatting |
| **Vitest** | 1.0+ | Unit testing (backend) |
| **React Testing Library** | 14+ | Component testing |

---

## Database Design

### Schema Overview

The database schema follows a **normalized relational design** with clear separation between authentication, authorization, and business data.

### Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    User     │────────<│  UserRole   │>────────│    Role     │
└─────────────┘         └─────────────┘         └─────────────┘
      │                                                 │
      │                                                 │
      │                                          ┌──────▼──────┐
      │                                          │ RolePolicy  │
      │                                          └──────┬──────┘
      │                                                 │
      ▼                                                 ▼
┌─────────────┐                                 ┌─────────────┐
│   Session   │                                 │   Policy    │
└─────────────┘                                 └─────────────┘
                                                       │
      │                                                │
      │                                                ▼
      │                                         ┌─────────────┐
      │                                         │ Permission  │
      ▼                                         └─────────────┘
┌─────────────┐
│  AuditLog   │
└─────────────┘

      │
      ▼
┌─────────────┐         ┌─────────────┐
│    Order    │────────<│  OrderItem  │>────────┐
└─────────────┘         └─────────────┘         │
                                                 │
                                                 ▼
                                          ┌─────────────┐
                                          │   Product   │
                                          └─────────────┘
```

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// AUTHENTICATION & USERS
// ============================================

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hashed
  firstName String?
  lastName  String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  roles     UserRole[]
  sessions  Session[]
  auditLogs AuditLog[]
  orders    Order[]
  
  @@map("users")
  @@index([email])
  @@index([isActive])
}

model Session {
  id        String   @id @default(cuid())
  sid       String   @unique // Session ID from express-session
  sess      Json     // Session data
  expire    DateTime // Expiration timestamp
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([expire])
  @@index([userId])
  @@map("sessions")
}

// ============================================
// RBAC + POLICY SYSTEM
// ============================================

model Role {
  id          String   @id @default(cuid())
  name        String   @unique  // 'admin', 'finance', 'intern'
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  users       UserRole[]
  policies    RolePolicy[]
  
  @@map("roles")
  @@index([name])
  @@index([isActive])
}

model Policy {
  id          String   @id @default(cuid())
  name        String   @unique  // 'ViewAllOrders', 'ManageOwnOrders'
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  roles       RolePolicy[]
  permissions Permission[]
  
  @@map("policies")
  @@index([name])
  @@index([isActive])
}

model Permission {
  id         String   @id @default(cuid())
  policyId   String
  
  // CASL Ability fields
  action     String   // 'create', 'read', 'update', 'delete', 'manage'
  subject    String   // 'Order', 'Product', 'User', 'all'
  fields     String[] // ['status', 'price'] or [] for all fields
  conditions Json?    // MongoDB-style conditions: { userId: '{{currentUser.id}}' }
  inverted   Boolean  @default(false) // true = "cannot", false = "can"
  reason     String?  // Human-readable explanation
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  // Relations
  policy     Policy   @relation(fields: [policyId], references: [id], onDelete: Cascade)
  
  @@map("permissions")
  @@index([policyId])
  @@index([subject, action])
}

// Junction Tables

model UserRole {
  userId     String
  roleId     String
  assignedAt DateTime @default(now())
  assignedBy String?  // User ID who assigned this role
  
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role       Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
  @@id([userId, roleId])
  @@map("user_roles")
  @@index([userId])
  @@index([roleId])
}

model RolePolicy {
  roleId     String
  policyId   String
  assignedAt DateTime @default(now())
  
  role       Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  policy     Policy   @relation(fields: [policyId], references: [id], onDelete: Cascade)
  
  @@id([roleId, policyId])
  @@map("role_policies")
  @@index([roleId])
  @@index([policyId])
}

// ============================================
// BUSINESS ENTITIES
// ============================================

model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  stock       Int      @default(0)
  sku         String?  @unique
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  orderItems  OrderItem[]
  
  @@map("products")
  @@index([sku])
  @@index([isActive])
}

model Order {
  id          String      @id @default(cuid())
  orderNumber String      @unique
  userId      String
  status      OrderStatus @default(PENDING)
  totalAmount Decimal     @db.Decimal(10, 2)
  notes       String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  user        User        @relation(fields: [userId], references: [id])
  items       OrderItem[]
  
  @@map("orders")
  @@index([userId])
  @@index([status])
  @@index([orderNumber])
}

model OrderItem {
  id        String   @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  price     Decimal  @db.Decimal(10, 2) // Price at time of order
  
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id])
  
  @@map("order_items")
  @@index([orderId])
  @@index([productId])
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

// ============================================
// AUDIT LOGS
// ============================================

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?
  action     String   // 'CREATE_ROLE', 'UPDATE_PERMISSION', 'DELETE_POLICY'
  entity     String   // 'Role', 'Policy', 'Permission', 'User'
  entityId   String?
  changes    Json?    // { before: {...}, after: {...} }
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())
  
  user       User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@map("audit_logs")
  @@index([userId])
  @@index([entity, entityId])
  @@index([createdAt])
  @@index([action])
}
```

### Database Indexing Strategy

**Performance-Critical Indexes:**

1. **Users Table:**
   - `email` (unique) - Login lookups
   - `isActive` - Filtering active users

2. **Sessions Table:**
   - `sid` (unique) - Session retrieval
   - `expire` - Cleanup expired sessions
   - `userId` - User session queries

3. **Roles Table:**
   - `name` (unique) - Role lookups by name
   - `isActive` - Active role filtering

4. **Permissions Table:**
   - `policyId` - Policy permission lookup
   - `(subject, action)` - Composite for permission checks

5. **Junction Tables:**
   - All foreign keys indexed automatically
   - Composite primary keys for uniqueness

6. **Audit Logs:**
   - `createdAt` - Time-based queries
   - `(entity, entityId)` - Entity change history
   - `action` - Filter by action type

### Data Retention Policy

| Table | Retention | Cleanup Strategy |
|-------|-----------|------------------|
| Users | Indefinite | Soft delete (isActive = false) |
| Sessions | 7 days after expiry | Automated cleanup job |
| Audit Logs | 90 days | Automated archival/deletion |
| Orders | Indefinite | Business requirement |
| Products | Indefinite | Soft delete (isActive = false) |

---

## Backend Architecture

### Directory Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Migration files
│   └── seed.ts                # Seed data script
├── src/
│   ├── config/
│   │   ├── database.ts        # Prisma client setup
│   │   ├── session.ts         # Session configuration
│   │   ├── cors.ts            # CORS configuration
│   │   └── env.ts             # Environment validation
│   ├── middleware/
│   │   ├── auth.ts            # Authentication guard
│   │   ├── attachAbility.ts   # CASL ability injection
│   │   ├── errorHandler.ts    # Global error handler
│   │   ├── auditLog.ts        # Audit logging
│   │   └── validator.ts       # Zod validation middleware
│   ├── services/
│   │   ├── abilityBuilder.ts  # CASL ability builder
│   │   ├── policyEngine.ts    # Permission resolution logic
│   │   ├── auditService.ts    # Audit log service
│   │   └── passwordService.ts # Password hashing/verification
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── admin/
│   │   │   ├── roles.controller.ts
│   │   │   ├── policies.controller.ts
│   │   │   ├── permissions.controller.ts
│   │   │   ├── users.controller.ts
│   │   │   └── audit.controller.ts
│   │   └── api/
│   │       ├── orders.controller.ts
│   │       └── products.controller.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── admin.routes.ts    # Aggregates all admin routes
│   │   └── api.routes.ts      # Business entity routes
│   ├── validators/
│   │   ├── auth.schema.ts
│   │   ├── admin.schema.ts
│   │   └── api.schema.ts
│   ├── types/
│   │   ├── express.d.ts       # Express type extensions
│   │   ├── casl.types.ts      # CASL type definitions
│   │   └── index.ts
│   ├── utils/
│   │   ├── permissions.ts     # Permission helper functions
│   │   ├── errors.ts          # Custom error classes
│   │   └── logger.ts          # Winston logger setup
│   ├── app.ts                 # Express app setup
│   └── server.ts              # Server entry point
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── tsconfig.json
├── package.json
└── Dockerfile
```

### Core Services

#### 1. Ability Builder Service

**Purpose:** Build CASL Ability object for a user based on their roles and policies

```typescript
// src/services/abilityBuilder.ts

import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import { PrismaClient } from '@prisma/client';

interface User {
  id: string;
  email: string;
  roles: Array<{ role: { name: string } }>;
}

interface CachedPermissions {
  timestamp: number;
  permissions: any[];
}

// In-memory cache (will be replaced with Redis in production)
const permissionCache = new Map<string, CachedPermissions>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class AbilityBuilderService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Build CASL Ability for a user
   * @param user - User object with roles
   * @returns MongoAbility instance
   */
  async defineAbilityFor(user: User | null): Promise<MongoAbility> {
    if (!user || !user.roles || user.roles.length === 0) {
      // Anonymous user - no permissions
      return createMongoAbility([]);
    }

    const roleNames = user.roles.map(ur => ur.role.name);
    const allPermissions = await this.getPermissionsForRoles(roleNames);
    
    return this.buildAbilityFromPermissions(allPermissions, user);
  }

  /**
   * Get all permissions for given roles (with caching)
   */
  private async getPermissionsForRoles(roleNames: string[]) {
    const cacheKey = roleNames.sort().join(',');
    const cached = permissionCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.permissions;
    }

    // Fetch permissions from database
    const permissions = await this.prisma.permission.findMany({
      where: {
        policy: {
          isActive: true,
          roles: {
            some: {
              role: {
                name: { in: roleNames },
                isActive: true
              }
            }
          }
        }
      },
      include: {
        policy: true
      }
    });

    permissionCache.set(cacheKey, {
      timestamp: Date.now(),
      permissions
    });

    return permissions;
  }

  /**
   * Build CASL ability from permission rules
   */
  private buildAbilityFromPermissions(permissions: any[], user: User) {
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

    for (const permission of permissions) {
      const { action, subject, conditions, fields, inverted } = permission;
      
      // Replace template variables in conditions
      const processedConditions = this.replaceVariables(conditions, user);
      
      const permissionFields = fields && fields.length > 0 ? fields : undefined;

      if (inverted) {
        cannot(action, subject, processedConditions, permissionFields);
      } else {
        can(action, subject, processedConditions, permissionFields);
      }
    }

    return build();
  }

  /**
   * Replace template variables in conditions
   * Example: { userId: '{{currentUser.id}}' } => { userId: 'user123' }
   */
  private replaceVariables(conditions: any, user: User): any {
    if (!conditions || typeof conditions !== 'object') {
      return conditions;
    }

    const conditionsStr = JSON.stringify(conditions);
    const replaced = conditionsStr
      .replace(/\{\{\s*currentUser\.id\s*\}\}/g, user.id)
      .replace(/\{\{\s*currentUser\.email\s*\}\}/g, user.email);

    return JSON.parse(replaced);
  }

  /**
   * Clear permission cache (call after permission changes)
   */
  clearCache(roleName?: string) {
    if (roleName) {
      // Clear all cache entries containing this role
      for (const [key] of permissionCache) {
        if (key.split(',').includes(roleName)) {
          permissionCache.delete(key);
        }
      }
    } else {
      permissionCache.clear();
    }
  }
}
```

#### 2. Audit Service

**Purpose:** Log all significant actions for compliance and debugging

```typescript
// src/services/auditService.ts

import { PrismaClient } from '@prisma/client';

interface AuditLogData {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  changes?: {
    before?: any;
    after?: any;
  };
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  constructor(private prisma: PrismaClient) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          changes: data.changes,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        }
      });
    } catch (error) {
      // Log to external service in production (DataDog, Sentry, etc.)
      console.error('Failed to create audit log:', error);
    }
  }

  async getLogs(filters: {
    userId?: string;
    entity?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 50, ...where } = filters;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: {
          ...(where.userId && { userId: where.userId }),
          ...(where.entity && { entity: where.entity }),
          ...(where.action && { action: where.action }),
          ...(where.startDate && where.endDate && {
            createdAt: {
              gte: where.startDate,
              lte: where.endDate
            }
          })
        },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      this.prisma.auditLog.count({ where })
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
```

### Middleware Implementation

#### 1. Authentication Middleware

```typescript
// src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    throw new ForbiddenError('Authentication required');
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.ability?.can('manage', 'all')) {
    throw new ForbiddenError('Admin access required');
  }
  next();
}
```

#### 2. Attach Ability Middleware

```typescript
// src/middleware/attachAbility.ts

import { Request, Response, NextFunction } from 'express';
import { AbilityBuilderService } from '../services/abilityBuilder';
import prisma from '../config/database';

const abilityBuilder = new AbilityBuilderService(prisma);

export async function attachAbility(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let user = null;

    if (req.session?.userId) {
      user = await prisma.user.findUnique({
        where: { id: req.session.userId },
        include: {
          roles: {
            include: {
              role: true
            }
          }
        }
      });
    }

    req.ability = await abilityBuilder.defineAbilityFor(user);
    req.user = user;
    
    next();
  } catch (error) {
    next(error);
  }
}
```

#### 3. Audit Logging Middleware

```typescript
// src/middleware/auditLog.ts

import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/auditService';
import prisma from '../config/database';

const auditService = new AuditService(prisma);

const AUDITABLE_PATHS = [
  '/admin/roles',
  '/admin/policies',
  '/admin/permissions',
  '/admin/users'
];

const ACTION_MAP: Record<string, string> = {
  POST: 'CREATE',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE'
};

export function auditLog(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;

  res.send = function (data: any) {
    // Only audit admin routes and mutating operations
    if (
      AUDITABLE_PATHS.some(path => req.path.startsWith(path)) &&
      ACTION_MAP[req.method]
    ) {
      const action = `${ACTION_MAP[req.method]}_${extractEntityFromPath(req.path)}`;
      
      auditService.log({
        userId: req.session?.userId,
        action,
        entity: extractEntityFromPath(req.path),
        entityId: req.params.id,
        changes: {
          before: res.locals.beforeData,
          after: data
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }).catch(err => console.error('Audit log failed:', err));
    }

    return originalSend.call(this, data);
  };

  next();
}

function extractEntityFromPath(path: string): string {
  const match = path.match(/\/admin\/([^\/]+)/);
  return match ? match[1].toUpperCase() : 'UNKNOWN';
}
```

### API Route Structure

```typescript
// src/routes/admin.routes.ts

import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import * as rolesController from '../controllers/admin/roles.controller';
import * as policiesController from '../controllers/admin/policies.controller';
import * as permissionsController from '../controllers/admin/permissions.controller';
import * as usersController from '../controllers/admin/users.controller';
import * as auditController from '../controllers/admin/audit.controller';
import { validate } from '../middleware/validator';
import * as schemas from '../validators/admin.schema';

const router = Router();

// All admin routes require authentication and admin permission
router.use(requireAuth);
router.use(requireAdmin);

// Roles
router.get('/roles', rolesController.list);
router.post('/roles', validate(schemas.createRole), rolesController.create);
router.get('/roles/:id', rolesController.getOne);
router.put('/roles/:id', validate(schemas.updateRole), rolesController.update);
router.delete('/roles/:id', rolesController.remove);

// Policies
router.get('/policies', policiesController.list);
router.post('/policies', validate(schemas.createPolicy), policiesController.create);
router.get('/policies/:id', policiesController.getOne);
router.put('/policies/:id', validate(schemas.updatePolicy), policiesController.update);
router.delete('/policies/:id', policiesController.remove);

// Permissions
router.get('/permissions', permissionsController.list);
router.post('/permissions', validate(schemas.createPermission), permissionsController.create);
router.put('/permissions/:id', validate(schemas.updatePermission), permissionsController.update);
router.delete('/permissions/:id', permissionsController.remove);

// Users
router.get('/users', usersController.list);
router.post('/users', validate(schemas.createUser), usersController.create);
router.get('/users/:id', usersController.getOne);
router.put('/users/:id', validate(schemas.updateUser), usersController.update);
router.delete('/users/:id', usersController.remove);
router.post('/users/:id/roles', usersController.assignRole);
router.delete('/users/:id/roles/:roleId', usersController.removeRole);

// Audit Logs
router.get('/audit-logs', auditController.list);
router.get('/audit-logs/:id', auditController.getOne);

// Utility endpoints
router.get('/permission-matrix', permissionsController.getMatrix);
router.post('/permission-test', permissionsController.testPermission);

export default router;
```

---

## Frontend Architecture

### Directory Structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── admin/
│   │   │   ├── roles/
│   │   │   │   ├── RoleList.tsx
│   │   │   │   ├── RoleForm.tsx
│   │   │   │   ├── RoleCard.tsx
│   │   │   │   └── DeleteRoleDialog.tsx
│   │   │   ├── policies/
│   │   │   │   ├── PolicyList.tsx
│   │   │   │   ├── PolicyForm.tsx
│   │   │   │   ├── PolicyCard.tsx
│   │   │   │   └── PermissionBuilder.tsx
│   │   │   ├── users/
│   │   │   │   ├── UserList.tsx
│   │   │   │   ├── UserForm.tsx
│   │   │   │   ├── UserCard.tsx
│   │   │   │   └── RoleAssignment.tsx
│   │   │   ├── PermissionMatrix.tsx
│   │   │   ├── AuditLogViewer.tsx
│   │   │   └── PermissionTester.tsx
│   │   └── common/
│   │       ├── DataTable.tsx
│   │       ├── ConditionBuilder.tsx
│   │       ├── FieldSelector.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorBoundary.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── admin/
│   │   │   ├── RolesPage.tsx
│   │   │   ├── PoliciesPage.tsx
│   │   │   ├── UsersPage.tsx
│   │   │   ├── PermissionMatrixPage.tsx
│   │   │   └── AuditLogsPage.tsx
│   │   ├── OrdersPage.tsx
│   │   ├── ProductsPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── roleStore.ts
│   │   ├── policyStore.ts
│   │   ├── userStore.ts
│   │   └── uiStore.ts
│   ├── services/
│   │   ├── api.ts              # Axios instance
│   │   ├── authService.ts
│   │   ├── roleService.ts
│   │   ├── policyService.ts
│   │   └── userService.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePermission.ts
│   │   ├── useRoles.ts
│   │   ├── usePolicies.ts
│   │   └── useDebounce.ts
│   ├── lib/
│   │   └── utils.ts            # Helper functions
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── role.types.ts
│   │   ├── policy.types.ts
│   │   └── index.ts
│   ├── config/
│   │   └── constants.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── package.json
└── Dockerfile
```

### State Management (Zustand)

```typescript
// src/stores/authStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authService from '../services/authService';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: Array<{ role: { name: string } }>;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        const user = await authService.login(email, password);
        set({ user, isAuthenticated: true });
      },

      logout: async () => {
        await authService.logout();
        set({ user: null, isAuthenticated: false });
      },

      checkSession: async () => {
        try {
          const user = await authService.getCurrentUser();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
);
```

```typescript
// src/stores/roleStore.ts

import { create } from 'zustand';
import * as roleService from '../services/roleService';
import { Role } from '../types';

interface RoleState {
  roles: Role[];
  selectedRole: Role | null;
  isLoading: boolean;
  error: string | null;
  fetchRoles: () => Promise<void>;
  createRole: (data: Partial<Role>) => Promise<void>;
  updateRole: (id: string, data: Partial<Role>) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  selectRole: (role: Role | null) => void;
}

export const useRoleStore = create<RoleState>((set, get) => ({
  roles: [],
  selectedRole: null,
  isLoading: false,
  error: null,

  fetchRoles: async () => {
    set({ isLoading: true, error: null });
    try {
      const roles = await roleService.getRoles();
      set({ roles, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createRole: async (data) => {
    const newRole = await roleService.createRole(data);
    set((state) => ({ roles: [...state.roles, newRole] }));
  },

  updateRole: async (id, data) => {
    const updatedRole = await roleService.updateRole(id, data);
    set((state) => ({
      roles: state.roles.map((r) => (r.id === id ? updatedRole : r))
    }));
  },

  deleteRole: async (id) => {
    await roleService.deleteRole(id);
    set((state) => ({
      roles: state.roles.filter((r) => r.id !== id)
    }));
  },

  selectRole: (role) => set({ selectedRole: role })
}));
```

### Key Components

#### Permission Matrix Component

```typescript
// src/components/admin/PermissionMatrix.tsx

import { useState, useEffect } from 'react';
import { useRoleStore } from '../../stores/roleStore';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import * as permissionService from '../../services/permissionService';

const SUBJECTS = ['User', 'Order', 'Product'];
const ACTIONS = ['create', 'read', 'update', 'delete'];

export function PermissionMatrix() {
  const { roles } = useRoleStore();
  const [matrix, setMatrix] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatrix();
  }, []);

  const loadMatrix = async () => {
    const data = await permissionService.getMatrix();
    setMatrix(data);
    setLoading(false);
  };

  const togglePermission = async (roleId: string, subject: string, action: string) => {
    // Implementation
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Permission Matrix</h2>
        <Button onClick={() => exportMatrix()}>Export CSV</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role</TableHead>
            <TableHead>Subject</TableHead>
            {ACTIONS.map(action => (
              <TableHead key={action} className="text-center">
                {action}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map(role =>
            SUBJECTS.map(subject => (
              <TableRow key={`${role.id}-${subject}`}>
                <TableCell>{role.name}</TableCell>
                <TableCell>{subject}</TableCell>
                {ACTIONS.map(action => (
                  <TableCell key={action} className="text-center">
                    <Checkbox
                      checked={hasPermission(role.id, subject, action)}
                      onCheckedChange={() => togglePermission(role.id, subject, action)}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

## Security Considerations

### Authentication Security

1. **Password Security:**
   - Bcrypt hashing with cost factor 12
   - Minimum password length: 8 characters
   - Password complexity requirements enforced
   - No password stored in plaintext anywhere

2. **Session Security:**
   - Secure, HttpOnly cookies
   - SameSite=Strict attribute
   - Session rotation on privilege escalation
   - Configurable session timeout (default: 24 hours)
   - Automatic session cleanup for expired sessions

3. **Brute Force Protection:**
   - Rate limiting on login endpoint (5 attempts per 15 minutes)
   - Account lockout after 10 failed attempts
   - CAPTCHA after 3 failed attempts (future enhancement)

### Authorization Security

1. **Principle of Least Privilege:**
   - Default deny policy (no permissions by default)
   - Explicit permission grants required
   - Admin actions require explicit "manage all" permission

2. **Permission Checks:**
   - All API endpoints protected by CASL checks
   - Field-level filtering on responses
   - Condition evaluation server-side only

3. **Audit Trail:**
   - All permission changes logged
   - User actions on sensitive data logged
   - Immutable audit logs (no deletion allowed)

### Application Security

1. **Input Validation:**
   - Zod schema validation on all inputs
   - SQL injection prevention (Prisma ORM)
   - XSS prevention (input sanitization)
   - CSRF protection (SameSite cookies)

2. **API Security:**
   - CORS restricted to allowed origins
   - Rate limiting on all endpoints
   - Request size limits (10MB max)
   - Helmet.js security headers

3. **Secrets Management:**
   - Environment variables for all secrets
   - No secrets in code or version control
   - Database credentials rotated regularly
   - Session secret cryptographically random

### Network Security

1. **HTTPS Only:**
   - TLS 1.3 required in production
   - HTTP Strict Transport Security (HSTS)
   - Certificate pinning recommended

2. **Database Security:**
   - PostgreSQL SSL connections required
   - Least privilege database user
   - Connection pooling with max limits
   - Regular security updates

---

## API Specification

### Authentication Endpoints

#### POST /auth/login
**Description:** Authenticate user and create session

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "cuid123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": [
      { "role": { "name": "finance" } }
    ]
  }
}
```

**Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

#### POST /auth/logout
**Description:** Destroy session

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

#### GET /auth/me
**Description:** Get current user

**Response (200):**
```json
{
  "user": {
    "id": "cuid123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": [
      { "role": { "name": "finance" } }
    ]
  }
}
```

### Admin - Role Management

#### GET /admin/roles
**Description:** List all roles

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50)
- `search` (string): Search by name

**Response (200):**
```json
{
  "data": [
    {
      "id": "role1",
      "name": "admin",
      "description": "Full system access",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z",
      "_count": {
        "users": 5,
        "policies": 10
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 3,
    "totalPages": 1
  }
}
```

#### POST /admin/roles
**Description:** Create new role

**Request:**
```json
{
  "name": "finance",
  "description": "Finance team access",
  "isActive": true
}
```

**Response (201):**
```json
{
  "data": {
    "id": "role2",
    "name": "finance",
    "description": "Finance team access",
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  }
}
```

#### GET /admin/roles/:id
**Description:** Get role details

**Response (200):**
```json
{
  "data": {
    "id": "role2",
    "name": "finance",
    "description": "Finance team access",
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z",
    "policies": [
      {
        "policy": {
          "id": "policy1",
          "name": "ViewAllOrders",
          "description": "Can view all orders"
        }
      }
    ],
    "users": [
      {
        "user": {
          "id": "user1",
          "email": "finance@example.com",
          "firstName": "Jane"
        }
      }
    ]
  }
}
```

#### PUT /admin/roles/:id
**Description:** Update role

**Request:**
```json
{
  "description": "Updated description",
  "isActive": false
}
```

#### DELETE /admin/roles/:id
**Description:** Delete role (cascade deletes user assignments)

**Response (200):**
```json
{
  "message": "Role deleted successfully"
}
```

### Admin - Policy Management

#### GET /admin/policies
**Description:** List all policies

**Response (200):**
```json
{
  "data": [
    {
      "id": "policy1",
      "name": "ViewAllOrders",
      "description": "Can view all orders in the system",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "_count": {
        "permissions": 2,
        "roles": 3
      }
    }
  ]
}
```

#### POST /admin/policies
**Description:** Create new policy

**Request:**
```json
{
  "name": "ManageOwnOrders",
  "description": "Can manage orders created by user",
  "isActive": true
}
```

#### GET /admin/policies/:id
**Description:** Get policy with permissions

**Response (200):**
```json
{
  "data": {
    "id": "policy1",
    "name": "ManageOwnOrders",
    "description": "Can manage orders created by user",
    "isActive": true,
    "permissions": [
      {
        "id": "perm1",
        "action": "read",
        "subject": "Order",
        "conditions": { "userId": "{{currentUser.id}}" },
        "fields": [],
        "inverted": false
      },
      {
        "id": "perm2",
        "action": "update",
        "subject": "Order",
        "conditions": { "userId": "{{currentUser.id}}" },
        "fields": ["notes"],
        "inverted": false
      }
    ],
    "roles": [
      {
        "role": {
          "id": "role1",
          "name": "intern"
        }
      }
    ]
  }
}
```

### Admin - Permission Management

#### POST /admin/permissions
**Description:** Create permission rule

**Request:**
```json
{
  "policyId": "policy1",
  "action": "create",
  "subject": "Order",
  "fields": [],
  "conditions": null,
  "inverted": false,
  "reason": "Interns can create orders"
}
```

**Validation Rules:**
- `action`: Must be one of: create, read, update, delete, manage
- `subject`: Required, non-empty string
- `fields`: Array of strings or empty array (empty = all fields)
- `conditions`: Valid JSON object or null
- `inverted`: Boolean

#### PUT /admin/permissions/:id
**Description:** Update permission

#### DELETE /admin/permissions/:id
**Description:** Delete permission

### Admin - User Management

#### GET /admin/users
**Description:** List all users

**Query Parameters:**
- `page`, `limit`, `search`
- `roleId` (string): Filter by role

**Response (200):**
```json
{
  "data": [
    {
      "id": "user1",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "roles": [
        {
          "role": {
            "id": "role1",
            "name": "finance"
          },
          "assignedAt": "2025-01-05T00:00:00Z"
        }
      ]
    }
  ]
}
```

#### POST /admin/users/:id/roles
**Description:** Assign role to user

**Request:**
```json
{
  "roleId": "role2"
}
```

#### DELETE /admin/users/:id/roles/:roleId
**Description:** Remove role from user

### Admin - Utility Endpoints

#### GET /admin/permission-matrix
**Description:** Get permission matrix for visualization

**Response (200):**
```json
{
  "data": {
    "roles": ["admin", "finance", "intern"],
    "subjects": ["User", "Order", "Product"],
    "actions": ["create", "read", "update", "delete"],
    "matrix": {
      "admin": {
        "User": { "create": true, "read": true, "update": true, "delete": true },
        "Order": { "create": true, "read": true, "update": true, "delete": true },
        "Product": { "create": true, "read": true, "update": true, "delete": true }
      },
      "finance": {
        "User": { "create": false, "read": true, "update": false, "delete": false },
        "Order": { "create": false, "read": true, "update": false, "delete": false },
        "Product": { "create": false, "read": true, "update": false, "delete": false }
      },
      "intern": {
        "User": { "create": false, "read": false, "update": false, "delete": false },
        "Order": { "create": true, "read": true, "update": true, "delete": false },
        "Product": { "create": false, "read": true, "update": false, "delete": false }
      }
    }
  }
}
```

#### POST /admin/permission-test
**Description:** Test if user has permission

**Request:**
```json
{
  "userId": "user1",
  "action": "update",
  "subject": "Order",
  "subjectId": "order123"
}
```

**Response (200):**
```json
{
  "allowed": true,
  "reason": "User has 'ManageOwnOrders' policy via 'intern' role",
  "matchedPolicies": ["ManageOwnOrders"],
  "appliedConditions": {
    "userId": "user1"
  },
  "restrictedFields": ["notes"]
}
```

### Admin - Audit Logs

#### GET /admin/audit-logs
**Description:** Get audit logs

**Query Parameters:**
- `page`, `limit`
- `userId`, `entity`, `action`
- `startDate`, `endDate` (ISO format)

**Response (200):**
```json
{
  "data": [
    {
      "id": "log1",
      "userId": "user1",
      "action": "CREATE_ROLE",
      "entity": "Role",
      "entityId": "role2",
      "changes": {
        "after": {
          "name": "finance",
          "description": "Finance team"
        }
      },
      "ipAddress": "192.168.1.1",
      "createdAt": "2025-01-15T10:00:00Z",
      "user": {
        "email": "admin@example.com",
        "firstName": "Admin"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### Business Endpoints

#### GET /api/orders
**Description:** Get orders (filtered by permissions)

**Authorization:** User can only see orders they have permission to view

**Response (200):**
```json
{
  "data": [
    {
      "id": "order1",
      "orderNumber": "ORD-001",
      "userId": "user1",
      "status": "PENDING",
      "totalAmount": "150.00",
      "createdAt": "2025-01-10T00:00:00Z",
      "items": [
        {
          "id": "item1",
          "productId": "prod1",
          "quantity": 2,
          "price": "75.00",
          "product": {
            "name": "Product A"
          }
        }
      ]
    }
  ]
}
```

#### POST /api/orders
**Description:** Create new order

**Authorization:** Requires 'create' permission on 'Order'

**Request:**
```json
{
  "items": [
    {
      "productId": "prod1",
      "quantity": 2
    }
  ],
  "notes": "Rush order"
}
```

#### GET /api/products
**Description:** Get products

#### POST /api/products
**Description:** Create product (admin only)

---

## Implementation Plan

### Week 1: Backend Foundation

#### Day 1-2: Project Setup
**Tasks:**
- [ ] Initialize Node.js project with TypeScript
- [ ] Install dependencies (Express, Prisma, CASL, etc.)
- [ ] Setup ESLint + Prettier
- [ ] Create `.env.example` file
- [ ] Initialize Prisma with PostgreSQL
- [ ] Create initial database schema
- [ ] Run first migration

**Deliverables:**
- Working dev environment
- Database connection established
- Prisma Client generated

#### Day 3-4: Authentication
**Tasks:**
- [ ] Setup express-session with connect-pg-simple
- [ ] Implement password hashing with bcrypt
- [ ] Create auth routes (login, logout, me)
- [ ] Create auth middleware (requireAuth)
- [ ] Write auth controller tests

**Deliverables:**
- Working session-based authentication
- Login/logout endpoints functional
- Unit tests passing

#### Day 5-7: CASL Integration
**Tasks:**
- [ ] Install @casl/ability
- [ ] Create AbilityBuilderService
- [ ] Implement permission caching
- [ ] Create attachAbility middleware
- [ ] Test permission checks with sample data
- [ ] Document permission system

**Deliverables:**
- CASL ability builder working
- Middleware attaching abilities to requests
- Documentation for permission system

**Code Review Checkpoint:** Architecture review with tech lead

---

### Week 2: Admin API - RBAC

#### Day 8-10: Role & Policy Management
**Tasks:**
- [ ] Create role controller with CRUD
- [ ] Create policy controller with CRUD
- [ ] Add Zod validation schemas
- [ ] Implement error handling
- [ ] Add pagination support
- [ ] Write integration tests

**Deliverables:**
- `/admin/roles` endpoints functional
- `/admin/policies` endpoints functional
- Validation working
- Tests passing

#### Day 11-12: Permission Management
**Tasks:**
- [ ] Create permission controller
- [ ] Implement permission CRUD
- [ ] Add permission-to-policy association
- [ ] Implement condition variable replacement
- [ ] Cache invalidation on updates

**Deliverables:**
- `/admin/permissions` endpoints functional
- Permission cache working correctly
- Complex permission scenarios tested

#### Day 13-14: User Management & Audit
**Tasks:**
- [ ] Create user controller
- [ ] Implement role assignment endpoints
- [ ] Create AuditService
- [ ] Add audit logging middleware
- [ ] Create audit log endpoints
- [ ] Implement permission matrix endpoint
- [ ] Create permission tester endpoint

**Deliverables:**
- User management complete
- Audit logging working
- Utility endpoints functional

**Code Review Checkpoint:** API completeness review

---

### Week 3: Business API + Testing

#### Day 15-17: Business Entities
**Tasks:**
- [ ] Create product controller with CRUD
- [ ] Create order controller with CRUD
- [ ] Implement permission checks
- [ ] Add field-level filtering
- [ ] Test conditional access
- [ ] Add business logic validation

**Deliverables:**
- Product API functional
- Order API functional
- Permissions properly enforced

#### Day 18-19: Testing
**Tasks:**
- [ ] Write unit tests for services
- [ ] Write integration tests for all routes
- [ ] Test permission scenarios:
  - Admin can do everything
  - Finance can view all orders
  - Intern can manage own orders only
- [ ] Load testing (optional)
- [ ] Fix identified bugs

**Deliverables:**
- Test coverage > 80%
- All permission scenarios tested
- CI/CD ready

#### Day 20-21: Docker & Documentation
**Tasks:**
- [ ] Create Dockerfile for backend
- [ ] Create docker-compose.yml
- [ ] Setup PostgreSQL in Docker
- [ ] Test Docker setup locally
- [ ] Write API documentation (Swagger/OpenAPI)
- [ ] Create README with setup instructions
- [ ] Write seed script for demo data

**Deliverables:**
- Docker setup working
- API documentation complete
- Demo data available

**Milestone:** Backend production-ready

---

### Week 4: Frontend Foundation

#### Day 22-23: Project Setup
**Tasks:**
- [ ] Initialize Vite + React + TypeScript
- [ ] Install Tailwind CSS
- [ ] Setup shadcn/ui components
- [ ] Configure Zustand stores
- [ ] Setup Axios client
- [ ] Configure React Router
- [ ] Setup ESLint + Prettier

**Deliverables:**
- Frontend dev environment working
- UI library configured
- Routing setup

#### Day 24-25: Authentication UI
**Tasks:**
- [ ] Create login page
- [ ] Implement auth store
- [ ] Create auth service
- [ ] Add protected routes
- [ ] Implement logout
- [ ] Add loading states
- [ ] Handle auth errors

**Deliverables:**
- Login/logout working
- Protected routes enforced
- Session persistence working

#### Day 26-28: Layout & Navigation
**Tasks:**
- [ ] Create AppLayout component
- [ ] Build Sidebar navigation
- [ ] Create Header with user menu
- [ ] Add Dashboard page
- [ ] Implement responsive design
- [ ] Add loading indicators
- [ ] Create ErrorBoundary

**Deliverables:**
- Main layout complete
- Navigation working
- Responsive on mobile/tablet/desktop

**Demo:** Show working UI shell to stakeholders

---

### Week 5: Admin UI - Core Features

#### Day 29-30: Role Management UI
**Tasks:**
- [ ] Create RoleList component
- [ ] Build RoleForm (create/edit)
- [ ] Add role deletion
- [ ] Create role detail view
- [ ] Implement policy assignment UI
- [ ] Add search/filter
- [ ] Write component tests

**Deliverables:**
- Complete role management UI
- CRUD operations working
- Policy assignment functional

#### Day 31-32: Policy Management UI
**Tasks:**
- [ ] Create PolicyList component
- [ ] Build PolicyForm
- [ ] Create PermissionBuilder component
- [ ] Add permission CRUD within policy
- [ ] Implement drag-and-drop reordering
- [ ] Add policy detail view
- [ ] Test complex scenarios

**Deliverables:**
- Policy management complete
- Permission builder working
- Intuitive UX

#### Day 33-35: User Management UI
**Tasks:**
- [ ] Create UserList with DataTable
- [ ] Build UserForm
- [ ] Implement role assignment UI
- [ ] Add user detail view
- [ ] Show effective permissions
- [ ] Implement bulk operations
- [ ] Add filters and search

**Deliverables:**
- User management complete
- Role assignment working
- Permission preview functional

**Code Review Checkpoint:** UI/UX review

---

### Week 6: Advanced Features & Polish

#### Day 36-37: Permission Matrix
**Tasks:**
- [ ] Create PermissionMatrix component
- [ ] Implement grid layout
- [ ] Add toggle functionality
- [ ] Implement filters
- [ ] Add CSV export
- [ ] Optimize performance
- [ ] Add visual indicators

**Deliverables:**
- Interactive permission matrix
- Export functionality
- Performant rendering

#### Day 38-39: Audit Log Viewer
**Tasks:**
- [ ] Create AuditLogViewer component
- [ ] Implement log table
- [ ] Add filters (user, action, date)
- [ ] Create log detail modal
- [ ] Implement before/after diff view
- [ ] Add export functionality
- [ ] Pagination

**Deliverables:**
- Audit log viewer complete
- Filtering working
- Diff view functional

#### Day 40-41: Permission Tester
**Tasks:**
- [ ] Create PermissionTester component
- [ ] Add user/action/resource selectors
- [ ] Implement real-time testing
- [ ] Show matched policies
- [ ] Display applied conditions
- [ ] Show field restrictions
- [ ] Add debugging information

**Deliverables:**
- Permission tester working
- Helpful debugging info
- Edge cases handled

#### Day 42: Final Polish
**Tasks:**
- [ ] Implement ConditionBuilder UI
- [ ] Create FieldSelector component
- [ ] Add "Clone Role" feature
- [ ] Implement import/export policies
- [ ] Add loading states everywhere
- [ ] Improve error messages
- [ ] Fix UI bugs
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Final testing

**Deliverables:**
- All features complete
- UI polished
- Bugs fixed
- Accessible

**Final Review:** Complete system demo

---

## Testing Strategy

### Backend Testing

#### Unit Tests
**Framework:** Vitest  
**Coverage Target:** > 80%

**Test Suites:**
1. **Services:**
   - AbilityBuilderService
     - Permission resolution
     - Cache invalidation
     - Variable replacement
   - AuditService
     - Log creation
     - Log retrieval with filters
   - PasswordService
     - Hashing
     - Verification

2. **Middleware:**
   - Authentication
   - Ability attachment
   - Error handling
   - Audit logging

#### Integration Tests
**Framework:** Supertest + Vitest

**Test Scenarios:**
1. **Authentication Flow:**
   - Login with valid credentials
   - Login with invalid credentials
   - Session persistence
   - Logout

2. **Permission Scenarios:**
   - Admin can manage all resources
   - Finance can view all orders
   - Intern can manage only own orders
   - Field-level restrictions enforced
   - Conditional access working

3. **CRUD Operations:**
   - All admin endpoints
   - All business endpoints
   - Error cases
   - Validation

#### Load Testing (Optional)
**Tool:** k6

**Scenarios:**
- 100 concurrent users
- Permission check performance
- Database query optimization

### Frontend Testing

#### Unit Tests
**Framework:** Vitest + React Testing Library

**Test Suites:**
- Stores (Zustand)
- Services (API calls)
- Utility functions
- Hooks

#### Component Tests
**Framework:** React Testing Library

**Test Components:**
- Forms (validation, submission)
- Tables (sorting, filtering)
- Modals (open, close, actions)
- Permission-based rendering

#### End-to-End Tests (Optional)
**Framework:** Playwright

**Test Flows:**
- Complete user journey
- Admin workflows
- Error scenarios

---

## Deployment Strategy

### Local Development (Docker)

**docker-compose.yml:**
```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: permission-system-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: permission_system
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: permission-system-backend
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/permission_system
      SESSION_SECRET: your-secret-key-change-in-production
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: permission-system-frontend
    environment:
      VITE_API_URL: http://localhost:3000
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev

volumes:
  postgres_data:
```

### Environment Variables

**Backend (.env):**
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/permission_system

# Server
NODE_ENV=development
PORT=3000

# Session
SESSION_SECRET=your-super-secret-key-min-32-chars
SESSION_MAX_AGE=86400000  # 24 hours in milliseconds

# Security
BCRYPT_ROUNDS=12
ALLOWED_ORIGINS=http://localhost:5173

# Logging
LOG_LEVEL=debug
```

**Frontend (.env):**
```bash
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Permission Management System
```

### Production Deployment

**Recommendations:**

1. **Backend:**
   - Deploy on AWS ECS, Google Cloud Run, or Railway
   - Use managed PostgreSQL (AWS RDS, Supabase, etc.)
   - Enable Redis for permission caching
   - Setup monitoring (DataDog, New Relic, Sentry)
   - Configure auto-scaling
   - Use environment-specific secrets

2. **Frontend:**
   - Deploy on Vercel, Netlify, or Cloudflare Pages
   - Configure production API URL
   - Enable CDN
   - Setup error tracking (Sentry)

3. **Database:**
   - Regular automated backups
   - Point-in-time recovery enabled
   - Connection pooling (PgBouncer)
   - Read replicas for analytics

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Permission cache staleness** | Medium | High | Implement cache invalidation on updates, short TTL |
| **Performance degradation with many roles** | Medium | Medium | Database indexing, pagination, lazy loading |
| **Session storage bloat** | Low | Medium | Regular cleanup job, reasonable TTL |
| **Complex permission debugging** | High | Medium | Build permission tester tool, comprehensive logging |
| **CASL learning curve** | Medium | Low | Thorough documentation, examples, training |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Scope creep** | High | High | Strict change control, prioritize MVP |
| **Timeline overrun** | Medium | High | Weekly reviews, buffer time, phased rollout |
| **User adoption issues** | Medium | Medium | User training, intuitive UI, documentation |
| **Data migration complexity** | Low | High | Thorough testing, rollback plan, phased migration |

### Security Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Privilege escalation** | Low | Critical | Thorough testing, code review, audit logs |
| **Session hijacking** | Low | High | Secure cookies, HTTPS only, short TTL |
| **SQL injection** | Very Low | Critical | Prisma ORM, input validation |
| **Unauthorized access** | Low | High | Comprehensive permission checks, testing |

---

## Success Metrics

### Technical Metrics

1. **Performance:**
   - Permission check latency < 50ms (p95)
   - Page load time < 2 seconds
   - API response time < 200ms (p95)
   - Uptime > 99.9%

2. **Quality:**
   - Test coverage > 80%
   - Zero critical security vulnerabilities
   - < 5 bugs per 1000 lines of code
   - Code review approval rate > 95%

3. **Scalability:**
   - Support 1000 concurrent users
   - Handle 100 roles/policies
   - Process 10,000 requests/hour

### Business Metrics

1. **Adoption:**
   - 100% of admins trained within 2 weeks
   - < 5 support tickets per week after month 1
   - User satisfaction score > 4/5

2. **Efficiency:**
   - Permission setup time < 5 minutes
   - User onboarding time < 2 minutes
   - 50% reduction in access-related support tickets

3. **Compliance:**
   - 100% audit log coverage
   - Zero permission-related incidents
   - All permission changes traceable

---

## Appendices

### Appendix A: Glossary

- **PBAC:** Policy-Based Access Control
- **RBAC:** Role-Based Access Control
- **CASL:** JavaScript authorization library
- **Ability:** CASL object representing user's permissions
- **Policy:** Named collection of permissions
- **Subject:** Resource being accessed (e.g., Order, Product)
- **Action:** Operation being performed (create, read, update, delete)
- **Condition:** Rule limiting when permission applies
- **Field:** Specific attribute of a resource

### Appendix B: Example Permission Scenarios

#### Scenario 1: Admin Role
```typescript
Role: admin
Policies:
  - FullAccess
    Permissions:
      - action: manage, subject: all
```

#### Scenario 2: Finance Role
```typescript
Role: finance
Policies:
  - ViewAllOrders
    Permissions:
      - action: read, subject: Order
  - ViewAllProducts
    Permissions:
      - action: read, subject: Product
  - ExportReports
    Permissions:
      - action: export, subject: Report
```

#### Scenario 3: Intern Role
```typescript
Role: intern
Policies:
  - ManageOwnOrders
    Permissions:
      - action: create, subject: Order
      - action: read, subject: Order, conditions: { userId: '{{currentUser.id}}' }
      - action: update, subject: Order, conditions: { userId: '{{currentUser.id}}' }, fields: ['notes']
  - ViewProducts
    Permissions:
      - action: read, subject: Product
```

### Appendix C: Database Seed Data

```typescript
// Sample roles
const roles = [
  { name: 'admin', description: 'Full system access' },
  { name: 'finance', description: 'Finance team' },
  { name: 'intern', description: 'Limited access' }
];

// Sample policies
const policies = [
  {
    name: 'FullAccess',
    description: 'Complete system access',
    permissions: [
      { action: 'manage', subject: 'all' }
    ]
  },
  {
    name: 'ViewAllOrders',
    description: 'Can view all orders',
    permissions: [
      { action: 'read', subject: 'Order' }
    ]
  },
  {
    name: 'ManageOwnOrders',
    description: 'Can manage own orders',
    permissions: [
      { action: 'create', subject: 'Order' },
      { action: 'read', subject: 'Order', conditions: { userId: '{{currentUser.id}}' } },
      { action: 'update', subject: 'Order', conditions: { userId: '{{currentUser.id}}' }, fields: ['notes'] }
    ]
  }
];
```

### Appendix D: Future Enhancements

**Phase 2 (3 months):**
- Redis caching for permissions
- GraphQL API option
- Mobile app support
- SSO integration (OAuth, SAML)

**Phase 3 (6 months):**
- AI-powered permission recommendations
- Advanced analytics dashboard
- Multi-tenancy support
- API rate limiting per role

---

## Approval

**Prepared by:** [Your Name]  
**Date:** November 23, 2025  

**Reviewed by:**
- [ ] Tech Lead: _______________  Date: __________
- [ ] Security Team: _______________  Date: __________
- [ ] DevOps: _______________  Date: __________

**Approved by:**
- [ ] Engineering Manager: _______________  Date: __________

---

**Next Steps:**
1. Tech lead review and feedback
2. Address review comments
3. Finalize architecture decisions
4. Begin Week 1 implementation
5. Setup project repositories
6. Schedule weekly check-ins

---

*End of Technical Specification*