export type ApiSuccess<T> = { status: 'success'; data: T };
export type ApiError = { status: 'error'; message: string };

// Re-export lib utilities
export * from './lib/auth';
export * from './lib/prisma';
export * from './lib/errors';
