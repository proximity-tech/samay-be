import { z } from "zod";
import { LOGIN_SCHEMA, REGISTER_SCHEMA } from "./schema";

export type RegisterInput = z.infer<typeof REGISTER_SCHEMA>;
export type LoginInput = z.infer<typeof LOGIN_SCHEMA>;

// User interface (partial of Prisma User)
export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

// Error types

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}
