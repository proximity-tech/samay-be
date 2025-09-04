import { FastifyPluginAsync } from "fastify";
import { LOGIN_SCHEMA, REGISTER_SCHEMA } from "./schema";
import { register, login, logout, getCurrentUser } from "./service";
import { AuthError } from "./types";
import { ZodTypeProvider } from "fastify-type-provider-zod";

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma = fastify.prisma;
  // Register user

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/register",
    schema: {
      body: REGISTER_SCHEMA,
    },
    handler: async (request, reply) => {
      const input = request.body;
      const result = await register(input, prisma);

      return reply.status(201).send({
        data: result,
      });
    },
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/login",
    schema: {
      body: LOGIN_SCHEMA,
    },
    handler: async (request, reply) => {
      const input = request.body;
      const result = await login(input, prisma);

      return reply.send({
        data: result,
      });
    },
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/logout",
    handler: async (request, reply) => {
      try {
        const authHeader = request.headers.authorization || "";
        const token = authHeader.split(" ")[1];
        await logout(token, prisma);

        return reply.send({
          message: "Logged out successfully",
        });
      } catch (error) {
        if (error instanceof AuthError) {
          return reply.status(error.statusCode).send({
            error: error.message,
            code: error.code,
          });
        }
      }
    },
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/me",
    handler: async (request, reply) => {
      try {
        const { userId = "" } = request.user || {};
        const user = await getCurrentUser(userId, prisma);
        return reply.send({
          data: user,
        });
      } catch (error) {
        if (error instanceof AuthError) {
          return reply.status(error.statusCode).send({
            error: error.message,
            code: error.code,
          });
        }
      }
    },
  });
};

export default authRoutes;
