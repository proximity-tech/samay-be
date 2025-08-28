import { FastifyPluginAsync } from "fastify";
import { AuthService, registerSchema, loginSchema } from "../services/auth-service";

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Register user
  fastify.post(
    "/register",
    async (request, reply) => {
      try {
        const input = registerSchema.parse(request.body);
        const result = await AuthService.register(input, fastify.prisma);

        return reply.status(201).send({
          success: true,
          data: result,
        });
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(400).send({
            success: false,
            error: error.message,
          });
        }
        return reply.status(500).send({
          success: false,
          error: "Internal server error",
        });
      }
    }
  );

  // Login user
  fastify.post(
    "/login",
    async (request, reply) => {
      try {
        const input = loginSchema.parse(request.body);
        const result = await AuthService.login(input, fastify.prisma);

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error) {
        if (error instanceof Error) {
          const statusCode = error.message.includes("Invalid") ? 401 : 400;
          return reply.status(statusCode).send({
            success: false,
            error: error.message,
          });
        }
        return reply.status(500).send({
          success: false,
          error: "Internal server error",
        });
      }
    }
  );

  // Logout user
  fastify.post(
    "/logout",
    async (request, reply) => {
      try {
        const authHeader = request.headers.authorization;
        if (!authHeader) {
          return reply.status(401).send({
            success: false,
            error: "Authorization header required",
          });
        }

        const token = authHeader.split(" ")[1];
        await AuthService.logout(token, fastify.prisma);

        return reply.send({
          success: true,
          message: "Logged out successfully",
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: "Internal server error",
        });
      }
    }
  );

  // Get current user profile
  fastify.get(
    "/me",
    async (request, reply) => {
      try {
        const user = request.user;
        if (!user) {
          return reply.status(401).send({
            success: false,
            error: "Unauthorized",
          });
        }

        // Get fresh user data from database
        const userData = await fastify.prisma.user.findUnique({
          where: { id: user.userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        });

        if (!userData) {
          return reply.status(401).send({
            success: false,
            error: "User not found",
          });
        }

        return reply.send({
          success: true,
          data: userData,
        });
      } catch (error) {
        return reply.status(500).send({
          success: false,
          error: "Internal server error",
        });
      }
    }
  );
};

export default authRoutes;
