import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { getPrisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

function getBaseUrl(req: any) {
  const origin = req.headers['origin'] || `http://localhost:${process.env.PORT || 3000}`;
  return String(origin).replace(/\/$/, '');
}

// Create transporter only when SMTP is configured
function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    } : undefined,
  });
}

router.post('/signup', async (req, res, next) => {
  try {
    const { email, full_name, password } = req.body || {};
    if (!email || !full_name || !password) return res.status(400).json({ message: 'email, full_name, password required' });
    const prisma = getPrisma();

    const existing = await prisma.$queryRawUnsafe<any[]>(`SELECT Id FROM SalesApp_Login WHERE email = ? LIMIT 1`, email);
    if (existing.length) return res.status(409).json({ message: 'Email already registered' });

    const password_hash = await bcrypt.hash(String(password), 12);
    await prisma.$executeRawUnsafe(
      `INSERT INTO SalesApp_Login (employee_id, password_hash, full_name, email, role, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
      Date.now(), password_hash, full_name, email, 'executive'
    );

    const secret = process.env.JWT_SECRET as string;
    const token = jwt.sign({ email }, secret, { expiresIn: '2h' });
    const link = `${getBaseUrl(req)}/verify?token=${token}`;

    if (process.env.SMTP_HOST) {
      try {
        const transporter = getTransporter();
        if (transporter) {
          await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Verify your account',
            text: `Click to verify: ${link}`,
            html: `<p>Click to verify: <a href="${link}">Verify</a></p>`
          });
        }
      } catch (smtpError: any) {
        console.error('SMTP error:', smtpError.message);
        // Continue without email - log the link instead
        console.log(`🔗 Verification link for ${email}: ${link}`);
      }
    }

    return res.json({ message: 'Signup initiated. Check your email to verify.' });
  } catch (err) { next(err); }
});

router.post('/verify', async (req, res, next) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ message: 'token required' });
    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as any;
    const email = decoded.email as string;
    const prisma = getPrisma();
    await prisma.$executeRawUnsafe(`UPDATE SalesApp_Login SET status = 'active' WHERE email = ?`, email);
    return res.json({ message: 'Account verified' });
  } catch (err) { next(err); }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'email required' });
    const prisma = getPrisma();
    const user = await prisma.$queryRawUnsafe<any[]>(`SELECT Id, email FROM SalesApp_Login WHERE email = ? AND deleted = 0 LIMIT 1`, email);
    if (!user.length) return res.json({ message: 'If the email exists, a reset link has been sent' });

    const secret = process.env.JWT_SECRET as string;
    const token = jwt.sign({ email }, secret, { expiresIn: '1h' });
    const link = `${getBaseUrl(req)}/reset-password?token=${token}`;

    if (process.env.SMTP_HOST) {
      try {
        const transporter = getTransporter();
        if (transporter) {
          await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Reset your password',
            text: `Click to reset: ${link}`,
            html: `<p>Click to reset: <a href="${link}">Reset Password</a></p>`
          });
        }
      } catch (smtpError: any) {
        console.error('SMTP error:', smtpError.message);
        // Continue without email - log the reset link instead
        console.log(`🔗 Password reset link for ${email}: ${link}`);
      }
    } else {
      // For development - log the reset link to console
      console.log(`🔗 Password reset link for ${email}: ${link}`);
    }

    return res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (err) { next(err); }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) return res.status(400).json({ message: 'token and newPassword required' });
    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as any;
    const email = decoded.email as string;
    const prisma = getPrisma();
    const password_hash = await bcrypt.hash(String(newPassword), 12);
    await prisma.$executeRawUnsafe(`UPDATE SalesApp_Login SET password_hash = ? WHERE email = ?`, password_hash, email);
    return res.json({ message: 'Password updated' });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { employee_id, email, password } = req.body || {};
    if ((!employee_id && !email) || !password) {
      return res.status(400).json({ message: 'employee_id or email and password are required' });
    }

    const prisma = getPrisma();

    // Fetch user (non-destructive raw SQL to avoid model name assumptions)
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM SalesApp_Login WHERE ${employee_id ? 'employee_id = ?' : 'email = ?'} AND deleted = 0 LIMIT 1`,
      employee_id ?? email
    );

    const user = rows?.[0];
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (String(user.status) === 'pending') return res.status(403).json({ message: 'Please verify your email' });

    const ok = await bcrypt.compare(String(password), String(user.password_hash));
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    // Update last_login (non-destructive)
    await prisma.$executeRawUnsafe(
      `UPDATE SalesApp_Login SET last_login = NOW() WHERE Id = ?`,
      user.Id
    );

    const secret = process.env.JWT_SECRET as string;
    const refreshSecret = process.env.JWT_REFRESH_SECRET as string || secret;

    const accessToken = jwt.sign(
      { sub: String(user.employee_id), name: String(user.full_name), role: String(user.role) },
      secret,
      { expiresIn: '7d' }
    );
    const refreshToken = jwt.sign(
      { sub: String(user.employee_id) },
      refreshSecret,
      { expiresIn: '30d' }
    );

    return res.json({
      token: accessToken,
      refreshToken,
      user: {
        id: Number(user.Id),
        employee_id: String(user.employee_id),
        name: String(user.full_name),
        email: String(user.email),
        role: String(user.role),
        status: String(user.status)
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  return res.json({ user });
});

export default router;
