import type { ServerResponse } from 'http';

export function unauthorized(res: ServerResponse) {
  res.writeHead(401, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Unauthorized' }));
}

export function badRequest(res: ServerResponse, message: string) {
  res.writeHead(400, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: message }));
}

export function serverError(res: ServerResponse, error: unknown) {
  console.error('Server error:', error);
  res.writeHead(500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Internal server error' }));
}