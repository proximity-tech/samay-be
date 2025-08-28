import { PrismaClient, User } from "@prisma/client";
import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = "7d";

// Validation schemas
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
  token: string;
}

export class AuthService {

  /**
   * Register a new user
   */
  static async register(input: RegisterInput, prisma: PrismaClient): Promise<AuthResponse> {
    const { email, password, name } = input;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await argon2.hash(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Generate JWT token
    const token = this.generateToken(user);

    // Create session
    await this.createSession(user.id, token, prisma);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Login user
   */
  static async login(input: LoginInput, prisma: PrismaClient): Promise<AuthResponse> {
    const { email, password } = input;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isValidPassword = await argon2.verify(user.password, password);

    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }

    // Generate JWT token
    const token = this.generateToken(user);

    // Create session
    await this.createSession(user.id, token, prisma);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Logout user by invalidating session
   */
  static async logout(token: string, prisma: PrismaClient): Promise<void> {
    await prisma.session.deleteMany({
      where: { token },
    });
  }

  /**
   * Validate JWT token and return user
   */
  static async validateToken(token: string, prisma: PrismaClient): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      
      // Check if session exists and is not expired
      const session = await prisma.session.findFirst({
        where: {
          token,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      });

      if (!session) {
        return null;
      }

      return session.user;
    } catch {
      return null;
    }
  }

  /**
   * Generate JWT token
   */
  private static generateToken(user: User): string {
    const payload = {
      userId: user.id,
      role: user.role,
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  /**
   * Create session for user
   */
  private static async createSession(userId: string, token: string, prisma: PrismaClient): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }
}
