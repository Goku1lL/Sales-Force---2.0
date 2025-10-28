import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export interface AuthPayload {
  sub: string;
  employee_id: string;
  iat: number;
  exp: number;
}

export function verifyToken(request: NextRequest): AuthPayload | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const payload = jwt.verify(token, secret) as AuthPayload;
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function createResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function createErrorResponse(message: string, status: number = 400) {
  return createResponse({ error: message }, status);
}
