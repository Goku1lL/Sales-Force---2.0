import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getBaseUrl(req: VercelRequest) {
  const origin = req.headers['origin'] || 'http://localhost:3000';
  return String(origin).replace(/\/$/, '');
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  } : undefined,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, full_name, password } = req.body || {};
    if (!email || !full_name || !password) {
      return res.status(400).json({ message: 'email, full_name, password required' });
    }

    const existing = await prisma.$queryRawUnsafe<any[]>(`SELECT Id FROM SalesApp_Login WHERE email = ? LIMIT 1`, email);
    if (existing.length) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(String(password), 12);
    await prisma.$executeRawUnsafe(
      `INSERT INTO SalesApp_Login (employee_id, password_hash, full_name, email, role, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
      Date.now(), password_hash, full_name, email, 'executive'
    );

    const secret = process.env.JWT_SECRET as string;
    const token = jwt.sign({ email }, secret, { expiresIn: '2h' });
    const link = `${getBaseUrl(req)}/verify?token=${token}`;

    if (process.env.SMTP_HOST) {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Verify your account',
        text: `Click to verify: ${link}`,
        html: `<p>Click to verify: <a href="${link}">Verify</a></p>`
      });
    }

    return res.json({ message: 'Signup initiated. Check your email to verify.' });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
