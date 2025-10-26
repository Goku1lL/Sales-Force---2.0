import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { getPrisma } from '../_lib/prisma';
import { badRequest, serverError } from '../_lib/errors';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body || {};
    if (!email) return badRequest(res, 'email required');
    
    const prisma = getPrisma();
    const user = await prisma.$queryRawUnsafe<any[]>(`SELECT Id, email FROM SalesApp_Login WHERE email = ? AND deleted = 0 LIMIT 1`, email);
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
