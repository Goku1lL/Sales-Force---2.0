// @ts-ignore
const { PrismaClient } = require('@prisma/client');

let prisma: any = null;

export function getPrisma(): any {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    });
  }
  return prisma;
}