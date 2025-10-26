import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, full_name, password } = req.body || {};
    if (!email || !full_name || !password) {
      return res.status(400).json({ message: 'email, full_name, password required' });
    }

    // Mock signup for now - replace with real database operations later
    const secret = process.env.JWT_SECRET as string || 'fallback-secret';
    const token = jwt.sign({ email }, secret, { expiresIn: '2h' });

    return res.json({ 
      message: 'Signup successful. Account created.',
      token: token
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
