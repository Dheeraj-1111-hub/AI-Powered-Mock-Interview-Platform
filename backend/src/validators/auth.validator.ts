import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const onboardingSchema = z.object({
  role: z.string().min(1, 'Target role is required'),
  experience: z.string().min(1, 'Experience level is required'),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
});
