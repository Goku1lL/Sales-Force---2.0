import type { VercelResponse } from '@vercel/node';

/**
 * Standard error response utility
 */
export function sendError(res: VercelResponse, statusCode: number, message: string) {
  return res.status(statusCode).json({ 
    status: 'error', 
    message 
  });
}

/**
 * Handle caught errors in serverless functions
 */
export function handleError(res: VercelResponse, error: unknown) {
  console.error('API Error:', error);
  
  if (error && typeof error === 'object' && 'statusCode' in error && 'message' in error) {
    const statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500;
    const message = typeof error.message === 'string' ? error.message : 'Internal server error';
    return sendError(res, statusCode, message);
  }
  
  return sendError(res, 500, 'Internal server error');
}

