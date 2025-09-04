import { z } from "zod/v4";

// Validation schemas
export const REGISTER_SCHEMA = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  name: z.string().min(1, "Name is required").optional(),
  mobile: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number format. Use +1234567890")
    .optional(),
});

export const LOGIN_SCHEMA = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});
