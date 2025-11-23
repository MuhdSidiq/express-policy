import { MongoAbility } from '@casl/ability';
import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      ability?: MongoAbility;
      user?: User & {
        roles: Array<{
          role: {
            id: string;
            name: string;
          };
        }>;
      } | null;
    }
    interface SessionData {
      userId?: string;
    }
  }
}

export {};
