import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:psql@localhost:5432/fraudguard?schema=public';

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
export * from '../generated/prisma/client.js';
