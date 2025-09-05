import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  CREATE_ACTIVITY_SCHEMA,
  UPDATE_ACTIVITY_SCHEMA,
  ACTIVITY_ID_PARAM_SCHEMA,
  ACTIVITIES_QUERY_SCHEMA,
} from "./schema";
import {
  createActivity,
  getActivities,
  updateActivity,
  deleteActivity,
  getActivityStats,
} from "./service";
import { ActivityError } from "./types";

const activityRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma = fastify.prisma;

  // Create activity
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/",
    schema: {
      body: CREATE_ACTIVITY_SCHEMA,
    },
    handler: async (request, reply) => {
      try {
        const { userId = "" } = request.user || {};
        const input = request.body;
        const result = await createActivity(input, userId, prisma);

        return reply.status(201).send({
          data: result,
        });
      } catch (error) {
        if (error instanceof ActivityError) {
          return reply.status(error.statusCode).send({
            error: error.message,
            code: error.code,
          });
        }
        throw error;
      }
    },
  });

  // Get all activities with pagination and filtering
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/",
    schema: {
      querystring: ACTIVITIES_QUERY_SCHEMA,
    },
    handler: async (request, reply) => {
      try {
        const { userId = "" } = request.user || {};
        const query = request.query;
        const result = await getActivities(userId, query, prisma);

        return reply.send({
          data: result,
        });
      } catch (error) {
        if (error instanceof ActivityError) {
          return reply.status(error.statusCode).send({
            error: error.message,
            code: error.code,
          });
        }
        throw error;
      }
    },
  });

  // Get activity statistics
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/stats",
    handler: async (request, reply) => {
      try {
        const { userId = "" } = request.user || {};
        const result = await getActivityStats(userId, prisma);

        return reply.send({
          data: result,
        });
      } catch (error) {
        if (error instanceof ActivityError) {
          return reply.status(error.statusCode).send({
            error: error.message,
            code: error.code,
          });
        }
        throw error;
      }
    },
  });

  // Update activity
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "PUT",
    url: "/:id",
    schema: {
      params: ACTIVITY_ID_PARAM_SCHEMA,
      body: UPDATE_ACTIVITY_SCHEMA,
    },
    handler: async (request, reply) => {
      try {
        const { userId = "" } = request.user || {};
        const { id } = request.params;
        const input = request.body;
        const result = await updateActivity(id, input, userId, prisma);

        return reply.send({
          data: result,
        });
      } catch (error) {
        if (error instanceof ActivityError) {
          return reply.status(error.statusCode).send({
            error: error.message,
            code: error.code,
          });
        }
        throw error;
      }
    },
  });

  // Delete activity
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "DELETE",
    url: "/:id",
    schema: {
      params: ACTIVITY_ID_PARAM_SCHEMA,
    },
    handler: async (request, reply) => {
      try {
        const { userId = "" } = request.user || {};
        const { id } = request.params;
        await deleteActivity(id, userId, prisma);

        return reply.send({
          message: "Activity deleted successfully",
        });
      } catch (error) {
        if (error instanceof ActivityError) {
          return reply.status(error.statusCode).send({
            error: error.message,
            code: error.code,
          });
        }
        throw error;
      }
    },
  });
};

export default activityRoutes;
