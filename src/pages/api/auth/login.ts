// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import { sendOTPEmail, sendSecurityAlertEmail } from '@/lib/email';

const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 15 * 60 * 1000; // 15 minutes in ms

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;
  const db = await connectToDatabase();
  const users = db.collection('users');

  const user = await users.findOne({ email });

  if (!user || !user.passwordHash) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const now = new Date();

  // Handle lockout
  if (user.loginBlockedUntil && new Date(user.loginBlockedUntil) > now) {
    return res.status(403).json({
      message: `Account temporarily locked. Try again later.`,
      lockUntil: user.loginBlockedUntil
    });
  }

  // ✅ If lockout time has passed, reset failed attempts and remove lock
  if (user.loginBlockedUntil && new Date(user.loginBlockedUntil) <= now) {
    await users.updateOne(
      { email },
      { 
        $set: { failedLoginAttempts: 0 }, 
        $unset: { loginBlockedUntil: "" } 
      }
    );
    // Update the user object to reflect the reset
    user.failedLoginAttempts = 0;
    delete user.loginBlockedUntil;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    // ✅ Fix: Use consistent field name and get current failed attempts
    const currentFailedAttempts = user.failedLoginAttempts || 0;
    const newFailedAttempts = currentFailedAttempts + 1;
    
    const updates: any = { 
      failedLoginAttempts: newFailedAttempts // ✅ Fix: Use correct field name
    };

    if (newFailedAttempts >= MAX_ATTEMPTS) {
      updates.loginBlockedUntil = new Date(now.getTime() + LOCK_DURATION);
      // Don't reset attempts here - keep them for reference
    }

    await users.updateOne({ email }, { $set: updates });

    // ✅ Fix: Calculate remaining based on NEW failed attempts
    const remaining = Math.max(0, MAX_ATTEMPTS - newFailedAttempts);
    
    return res.status(401).json({
      message:
        remaining === 0
          ? 'Too many failed attempts. Account is temporarily locked.'
          : `Invalid password. ${remaining} attempt(s) left.`,
      remainingAttempts: remaining,
      ...(updates.loginBlockedUntil && { lockUntil: updates.loginBlockedUntil }),
    });
  }

  if (user.status == 'deactive') {
  return res.status(403).json({ message: 'Your account is not active yet. Contact Admin' });
  }

  // On success: reset failed attempts and remove lock
  await users.updateOne(
    { email },
    { 
      $set: { failedLoginAttempts: 0 }, 
      $unset: { loginBlockedUntil: "" } 
    }
  );

  // Generate 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  await db.collection('otp_verifications').insertOne({
    email,
    otp,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  await sendOTPEmail(email, otp);

  setTimeout(async () => {
    try {
      // Check if user completed OTP verification
      const otpRecord = await db.collection('otp_verifications').findOne({ email, otp });
      
      // If OTP record still exists after 6 minutes, it means:
      // 1. User didn't complete verification, OR
      // 2. TTL hasn't cleaned it up yet
      // Either way, send security alert
      if (otpRecord) {
        await sendSecurityAlertEmail(
          email,
          req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
          req.headers['user-agent'] as string
        );
        console.log(`Security alert sent for incomplete OTP: ${email}`);
      }
    } catch (error) {
      console.error('Error sending delayed security alert:', error);
    }
  }, 4 * 60 * 1000); 

  return res.status(200).json({ message: 'OTP sent to your email' });
}
