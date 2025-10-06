import { z } from 'zod';

export const loginSchema = z.object({
  emailOrUsername: z.string()
    .min(1, "Email or username is required")
    .max(255, "Input too long"),
  password: z.string()
    .min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .trim(),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, dashes and underscores")
    .trim(),
  email: z.string()
    .email("Invalid email address")
    .max(255, "Email too long")
    .trim()
    .toLowerCase(),
  password: z.string()
    .min(12, "Password must be at least 12 characters")
    .max(128, "Password too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
