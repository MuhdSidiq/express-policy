import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import env from './env';

const PgSession = connectPgSimple(session);

export const sessionConfig: session.SessionOptions = {
  store: new PgSession({
    conString: env.DATABASE_URL,
    tableName: 'sessions',
    createTableIfMissing: false, // We'll create it via Prisma
  }),
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: parseInt(env.SESSION_MAX_AGE),
    httpOnly: true,
    secure: env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',
  },
  name: 'sessionId', // Custom cookie name
};
