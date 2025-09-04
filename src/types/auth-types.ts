import { z } from "zod";

// Validation schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
  name: z.string().min(1, "Name is required").optional(),
  mobile: z.string().regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number format. Use +1234567890").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// User interface (partial of Prisma User)
export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  mobile: string | null;
  role: string;
  createdAt: Date;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

// Error types
export interface AuthError {
  statusCode: number;
  message: string;
  code?: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
