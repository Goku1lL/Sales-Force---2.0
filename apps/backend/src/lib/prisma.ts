import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | undefined;

export const getPrisma = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: ['error', 'warn'],
    });
  }
  return prisma;
};

// Handle BigInt serialization
(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};
