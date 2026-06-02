import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import { reqUser } from '../middleware/auth';
import { sendEmail } from '../services/email.service';

const generateToken = () => crypto.randomBytes(32).toString('hex');

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(409).json({ message: 'Email already registered' });

  const hashed = await bcrypt.hash(password, 10);
  const verificationToken = generateToken();
  const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await User.create({ name, email, password: hashed, verificationToken, verificationTokenExpires });
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
  const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
  
  try {
    await sendEmail(
      user.email,
      'Verify your HireIQ AI Account',
      `<p>Welcome to HireIQ AI!</p><p>Please verify your email by clicking the link below:</p><a href="${verificationLink}">${verificationLink}</a>`
    );
  } catch (error) {
    console.error('Failed to send verification email, but user was created.', error);
  }

  res.json({ message: 'Registration successful. Please check your email to verify your account.' });
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Missing token' });

  const user = await User.findOne({ verificationToken: token, verificationTokenExpires: { $gt: new Date() } });
  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

  user.isEmailVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  res.json({ message: 'Email verified successfully' });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  if (!user.isEmailVerified) return res.status(403).json({ message: 'Please verify your email before logging in', code: 'UNVERIFIED' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'supersecretjwtkey', { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET || 'superrefreshkey', { expiresIn: '7d' });

  setRefreshCookie(res, refreshToken);
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, onboardingCompleted: user.onboardingCompleted } });
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: 'No refresh token provided' });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'superrefreshkey') as { userId: string };
    const token = jwt.sign({ userId: payload.userId }, process.env.JWT_SECRET || 'supersecretjwtkey', { expiresIn: '15m' });
    res.json({ token });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

  const resetToken = generateToken();
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
  
  try {
    await sendEmail(
      user.email,
      'Reset your HireIQ AI Password',
      `<p>You requested a password reset for your HireIQ AI account.</p><p>Click the link below to reset your password:</p><a href="${resetLink}">${resetLink}</a><p>If you did not request this, please ignore this email.</p>`
    );
  } catch (error) {
    console.error('Failed to send password reset email.', error);
  }

  res.json({ message: 'If that email exists, a reset link has been sent.' });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ message: 'Missing required fields' });

  const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: 'Password reset successful' });
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, onboardingCompleted: user.onboardingCompleted } });
  } catch (error) {
    res.status(401).json({ message: 'Invalid session' });
  }
};

export const onboarding = async (req: Request, res: Response) => {
  const { role, experience, skills } = req.body;
  const userId = reqUser(req);
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.role = role || user.role;
  user.experience = experience || user.experience;
  user.skills = skills || user.skills;
  user.onboardingCompleted = true;
  await user.save();

  res.json({ message: 'Onboarding completed', user: { id: user._id, name: user.name, role: user.role, onboardingCompleted: user.onboardingCompleted } });
};
