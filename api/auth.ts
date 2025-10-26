import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { getPrisma } from '../_utils/prisma';
import { requireAuth } from '../_utils/auth';
import { handleError } from '../_utils/errors';

function getBaseUrl(req: VercelRequest) {
  const origin = req.headers['origin'] || 'http://localhost:3000';
  return String(origin).replace(/\/$/, '');
}

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  } : undefined,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url } = req;
  
  try {
    // Route based on URL path
    if (url?.includes('/signup')) {
      return await handleSignup(req, res);
    } else if (url?.includes('/verify')) {
      return await handleVerify(req, res);
    } else if (url?.includes('/forgot-password')) {
      return await handleForgotPassword(req, res);
    } else if (url?.includes('/reset-password')) {
      return await handleResetPassword(req, res);
    } else if (url?.includes('/login')) {
      return await handleLogin(req, res);
    } else if (url?.includes('/me')) {
      return await handleMe(req, res);
    } else {
      return res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    return handleError(res, error);
  }
}

async function handleSignup(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, full_name, password } = req.body || {};
  if (!email || !full_name || !password) {
    return res.status(400).json({ message: 'email, full_name, password required' });
  }

  const prisma = getPrisma();
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
}

async function handleVerify(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body || {};
  if (!token) {
    return res.status(400).json({ message: 'token required' });
  }

  const secret = process.env.JWT_SECRET as string;
  const decoded = jwt.verify(token, secret) as any;
  const email = decoded.email as string;
  
  const prisma = getPrisma();
  await prisma.$executeRawUnsafe(`UPDATE SalesApp_Login SET status = 'active' WHERE email = ?`, email);
  
  return res.json({ message: 'Account verified' });
}

async function handleForgotPassword(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ message: 'email required' });
  }

  const prisma = getPrisma();
  const user = await prisma.$queryRawUnsafe<any[]>(`SELECT Id, email FROM SalesApp_Login WHERE email = ? AND deleted = 0 LIMIT 1`, email);
  if (!user.length) {
    return res.json({ message: 'If the email exists, a reset link has been sent' });
  }

  const secret = process.env.JWT_SECRET as string;
  const token = jwt.sign({ email }, secret, { expiresIn: '1h' });
  const link = `${getBaseUrl(req)}/reset-password?token=${token}`;

  if (process.env.SMTP_HOST) {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Reset your password',
      text: `Click to reset: ${link}`,
      html: `<p>Click to reset: <a href="${link}">Reset Password</a></p>`
    });
  } else {
    console.log(`🔗 Password reset link for ${email}: ${link}`);
  }

  return res.json({ message: 'If the email exists, a reset link has been sent' });
}

async function handleResetPassword(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'token and newPassword required' });
  }

  const secret = process.env.JWT_SECRET as string;
  const decoded = jwt.verify(token, secret) as any;
  const email = decoded.email as string;
  
  const prisma = getPrisma();
  const password_hash = await bcrypt.hash(String(newPassword), 12);
  await prisma.$executeRawUnsafe(`UPDATE SalesApp_Login SET password_hash = ? WHERE email = ?`, password_hash, email);
  
  return res.json({ message: 'Password updated' });
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { employee_id, email, password } = req.body || {};
  if ((!employee_id && !email) || !password) {
    return res.status(400).json({ message: 'employee_id or email and password are required' });
  }

  const prisma = getPrisma();
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM SalesApp_Login WHERE ${employee_id ? 'employee_id = ?' : 'email = ?'} AND deleted = 0 LIMIT 1`,
    employee_id ?? email
  );

  const user = rows?.[0];
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  if (String(user.status) === 'pending') return res.status(403).json({ message: 'Please verify your email' });

  const ok = await bcrypt.compare(String(password), String(user.password_hash));
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  await prisma.$executeRawUnsafe(
    `UPDATE SalesApp_Login SET last_login = NOW() WHERE Id = ?`,
    user.Id
  );

  const secret = process.env.JWT_SECRET as string;
  const refreshSecret = process.env.JWT_REFRESH_SECRET as string || secret;

  const accessToken = jwt.sign(
    { sub: Number(user.employee_id), name: String(user.full_name), role: String(user.role) },
    secret,
    { expiresIn: '7d' }
  );
  const refreshToken = jwt.sign(
    { sub: Number(user.employee_id) },
    refreshSecret,
    { expiresIn: '30d' }
  );

  return res.json({
    token: accessToken,
    refreshToken,
    user: {
      id: Number(user.Id),
      employee_id: Number(user.employee_id),
      name: String(user.full_name),
      email: String(user.email),
      role: String(user.role),
      status: String(user.status)
    }
  });
}

async function handleMe(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = requireAuth(req, res);
  if (!user) return;

  return res.json({ user });
}
