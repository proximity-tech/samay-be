import { PrismaClient, User } from "@prisma/client";
import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import { 
  RegisterInput, 
  LoginInput, 
  AuthResponse, 
  UserResponse,
  AuthError 
} from "../types/auth-types";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = "7d";

export class AuthService {

  /**
   * Register a new user
   */
  static async register(input: RegisterInput, prisma: PrismaClient): Promise<AuthResponse> {
    const { email, password, name, mobile } = input;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AuthError("User with this email already exists", 409, "USER_EXISTS");
    }

    // Hash password
    const hashedPassword = await argon2.hash(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        mobile,
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
        mobile: user.mobile,
        role: user.role,
        createdAt: user.createdAt,
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
      throw new AuthError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    // Verify password
    const isValidPassword = await argon2.verify(user.password, password);

    if (!isValidPassword) {
      throw new AuthError("Invalid email or password", 401, "INVALID_CREDENTIALS");
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
        mobile: user.mobile,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Logout user by invalidating session
   */
  static async logout(token: string, prisma: PrismaClient): Promise<void> {
    const deletedSessions = await prisma.session.deleteMany({
      where: { token },
    });

    if (deletedSessions.count === 0) {
      throw new AuthError("Invalid or expired token", 401, "INVALID_TOKEN");
    }
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
    } catch (error) {
      return null;
    }
  }

  /**
   * Get current user profile
   */
  static async getCurrentUser(userId: string, prisma: PrismaClient): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        mobile: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AuthError("User not found", 404, "USER_NOT_FOUND");
    }

    return user;
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
