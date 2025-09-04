import { PrismaClient, User } from "@prisma/client";
import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import {
  AuthError,
  AuthResponse,
  LoginInput,
  RegisterInput,
  UserResponse,
} from "./types";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = "7d";

/**
 * Register a new user
 */
export async function register(
  input: RegisterInput,
  prisma: PrismaClient
): Promise<AuthResponse> {
  const { email, password, name } = input;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AuthError(
      "User with this email already exists",
      409,
      "USER_EXISTS"
    );
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
  const token = generateToken(user);

  // Create session
  await createSession(user.id, token, prisma);

  // Destructure user object for response
  const { id, role, createdAt } = user;

  return {
    user: {
      id,
      email,
      name,
      role,
      createdAt,
    },
    token,
  };
}

/**
 * Login user
 */
export async function login(
  input: LoginInput,
  prisma: PrismaClient
): Promise<AuthResponse> {
  const { email, password } = input;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AuthError(
      "Invalid email or password",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  // Verify password
  const isValidPassword = await argon2.verify(user.password, password);

  if (!isValidPassword) {
    throw new AuthError(
      "Invalid email or password",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  // Generate JWT token
  const token = generateToken(user);

  // Create session
  await createSession(user.id, token, prisma);

  // Destructure user object for response
  const {
    id,
    email: userEmail,
    name: userName,
    role: userRole,
    createdAt,
  } = user;

  return {
    user: {
      id,
      email: userEmail,
      name: userName,
      role: userRole,
      createdAt,
    },
    token,
  };
}

/**
 * Logout user by invalidating session
 */
export async function logout(
  token: string,
  prisma: PrismaClient
): Promise<void> {
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
export async function validateToken(
  token: string,
  prisma: PrismaClient
): Promise<User | null> {
  try {
    jwt.verify(token, JWT_SECRET) as { userId: string };

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
 * Get current user profile
 */
export async function getCurrentUser(
  userId: string,
  prisma: PrismaClient
): Promise<UserResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
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
function generateToken(user: User): string {
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
async function createSession(
  userId: string,
  token: string,
  prisma: PrismaClient
): Promise<void> {
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
