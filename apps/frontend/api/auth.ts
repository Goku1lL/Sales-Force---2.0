import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { getPrisma, badRequest, serverError } from '@sfa/shared';

// Helper to extract sub-route from URL
function getSubRoute(req: VercelRequest): string {
  const url = req.url || '';
  // Remove query string
  const path = url.split('?')[0];
  // Extract the part after /api/auth/
  const match = path.match(/\/api\/auth\/(.+)/);
  return match ? match[1] : '';
}

function getBaseUrl(req: VercelRequest) {
  const origin = req.headers['origin'] || `http://localhost:${process.env.PORT || 3000}`;
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

export interface AuthPayload {
  sub: number;
  name?: string;
  role?: string;
}

function requireAuth(req: VercelRequest, res: VercelResponse): AuthPayload | null {
  try {
    const header = req.headers['authorization'];
    if (!header) {
      res.status(401).json({ error: 'Missing Authorization header' });
      return null;
    }
    const [type, token] = header.split(' ');
    if (type !== 'Bearer' || !token) {
      res.status(401).json({ error: 'Invalid Authorization header' });
      return null;
    }
    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as JwtPayload | string;

    let user: AuthPayload;
    if (typeof decoded === 'string') {
      user = { sub: 0 };
    } else {
      const subRaw = decoded.sub as unknown;
      const subNum = typeof subRaw === 'string' ? Number(subRaw) : typeof subRaw === 'number' ? subRaw : 0;
      user = {
        sub: subNum,
        name: typeof decoded["name"] === 'string' ? decoded["name"] : undefined,
        role: typeof decoded["role"] === 'string' ? decoded["role"] : undefined,
      };
    }
    return user;
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
}

// Handler: POST /api/auth/login
async function handleLogin(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { employee_id, email, password } = req.body || {};
    if ((!employee_id && !email) || !password) {
      return res.status(400).json({ message: 'employee_id or email and password are required' });
    }

    const prisma = getPrisma();

    // Query user from database
    let user: any;
    if (employee_id) {
      const result: any[] = await prisma.$queryRawUnsafe(
        `SELECT Id, employee_id, password_hash, full_name, email, role, status
         FROM SalesApp_Login
         WHERE employee_id = ? AND deleted = 0
         LIMIT 1`,
        employee_id
      );
      user = result[0];
    } else if (email) {
      const result: any[] = await prisma.$queryRawUnsafe(
        `SELECT Id, employee_id, password_hash, full_name, email, role, status
         FROM SalesApp_Login
         WHERE email = ? AND deleted = 0
         LIMIT 1`,
        email
      );
      user = result[0];
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is not active. Please contact administrator.' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    await prisma.$executeRawUnsafe(
      `UPDATE SalesApp_Login SET last_login = NOW() WHERE Id = ?`,
      user.Id
    );

    // Generate tokens
    const secret = process.env.JWT_SECRET as string;
    const refreshSecret = process.env.JWT_REFRESH_SECRET as string || secret;

    const accessToken = jwt.sign(
      {
        sub: Number(user.Id),
        name: user.full_name,
        role: user.role,
        employee_id: user.employee_id
      },
      secret,
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { sub: Number(user.Id) },
      refreshSecret,
      { expiresIn: '30d' }
    );

    return res.json({
      token: accessToken,
      refreshToken,
      user: {
        id: Number(user.Id),
        employee_id: user.employee_id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Handler: POST /api/auth/signup
async function handleSignup(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, full_name, password, employee_id, role } = req.body || {};
    if (!email || !full_name || !password) {
      return res.status(400).json({ message: 'email, full_name, and password are required' });
    }

    const prisma = getPrisma();

    // Check if user already exists
    const existingUsers: any[] = await prisma.$queryRawUnsafe(
      `SELECT Id FROM SalesApp_Login
       WHERE (email = ? OR employee_id = ?) AND deleted = 0
       LIMIT 1`,
      email,
      employee_id || ''
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'User with this email or employee ID already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Insert new user
    await prisma.$executeRawUnsafe(
      `INSERT INTO SalesApp_Login
       (employee_id, password_hash, full_name, email, role, status, created_at, updated_at, deleted)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), 0)`,
      employee_id || null,
      password_hash,
      full_name,
      email,
      role || 'executive',
      'pending' // Status is 'pending' until email verification
    );

    // Generate verification token
    const secret = process.env.JWT_SECRET as string;
    const token = jwt.sign({ email }, secret, { expiresIn: '24h' });

    // Send verification email (if SMTP is configured)
    const verificationLink = `${getBaseUrl(req)}/verify?token=${token}`;

    if (process.env.SMTP_HOST) {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Verify your account',
        text: `Click to verify your account: ${verificationLink}`,
        html: `
          <h2>Welcome to Sales Force App!</h2>
          <p>Please verify your account by clicking the link below:</p>
          <p><a href="${verificationLink}">Verify Account</a></p>
          <p>This link will expire in 24 hours.</p>
        `
      });
    } else {
      // For development - log the verification link
      console.log(`🔗 Verification link for ${email}: ${verificationLink}`);
    }

    return res.status(201).json({
      message: 'Signup successful. Please check your email to verify your account.',
      token: token
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Handler: POST /api/auth/verify
async function handleVerify(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.body || {};
    if (!token) return badRequest(res, 'token required');

    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as any;
    const email = decoded.email as string;

    const prisma = getPrisma();
    await prisma.$executeRawUnsafe(`UPDATE SalesApp_Login SET status = 'active' WHERE email = ?`, email);

    return res.json({ message: 'Account verified' });
  } catch (error) {
    return serverError(res, error);
  }
}

// Handler: GET /api/auth/me
async function handleMe(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = requireAuth(req, res);
    if (!user) return;

    return res.json({ user });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Handler: POST /api/auth/forgot-password
async function handleForgotPassword(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body || {};
    if (!email) return badRequest(res, 'email required');

    const prisma = getPrisma();
    const user: any[] = await prisma.$queryRawUnsafe(`SELECT Id, email FROM SalesApp_Login WHERE email = ? AND deleted = 0 LIMIT 1`, email);
    if (!user.length) return res.json({ message: 'If the email exists, a reset link has been sent' });

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
      // For development - log the reset link to console
      console.log(`🔗 Password reset link for ${email}: ${link}`);
    }

    return res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    return serverError(res, error);
  }
}

// Handler: POST /api/auth/reset-password
async function handleResetPassword(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) return badRequest(res, 'token and newPassword required');

    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as any;
    const email = decoded.email as string;

    const prisma = getPrisma();
    const password_hash = await bcrypt.hash(String(newPassword), 12);
    await prisma.$executeRawUnsafe(`UPDATE SalesApp_Login SET password_hash = ? WHERE email = ?`, password_hash, email);

    return res.json({ message: 'Password updated' });
  } catch (error) {
    return serverError(res, error);
  }
}

// Main handler - routes to sub-handlers based on URL
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const subRoute = getSubRoute(req);

  switch (subRoute) {
    case 'login':
      return handleLogin(req, res);
    case 'signup':
      return handleSignup(req, res);
    case 'verify':
      return handleVerify(req, res);
    case 'me':
      return handleMe(req, res);
    case 'forgot-password':
      return handleForgotPassword(req, res);
    case 'reset-password':
      return handleResetPassword(req, res);
    default:
      return res.status(404).json({ error: 'Not found' });
  }
}
