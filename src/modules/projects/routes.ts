import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  CREATE_PROJECT_SCHEMA,
  UPDATE_PROJECT_SCHEMA,
  PROJECT_ID_PARAM_SCHEMA,
  PROJECTS_QUERY_SCHEMA,
} from "./schema";
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
} from "./service";

const projectRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma = fastify.prisma;

  // Create project
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/",
    schema: {
      body: CREATE_PROJECT_SCHEMA,
    },
    handler: async (request, reply) => {
      const { userId = "" } = request.user || {};
      const input = request.body;
      const result = await createProject(input, userId, prisma);

      return reply.status(201).send({
        data: result,
        message: "Project created successfully",
      });
    },
  });

  // Get all projects with pagination and search
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/",
    schema: {
      querystring: PROJECTS_QUERY_SCHEMA,
    },
    handler: async (request, reply) => {
      const { userId = "" } = request.user || {};
      const query = request.query;
      const result = await getProjects(userId, query, prisma);

      return reply.send({
        data: result,
      });
    },
  });

  // Get single project by ID
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/:id",
    schema: {
      params: PROJECT_ID_PARAM_SCHEMA,
    },
    handler: async (request, reply) => {
      const { userId = "" } = request.user || {};
      const { id } = request.params;
      const projectId = parseInt(id);

      const result = await getProject(projectId, userId, prisma);

      return reply.send({
        data: result,
      });
    },
  });

  // Update project
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "PUT",
    url: "/:id",
    schema: {
      params: PROJECT_ID_PARAM_SCHEMA,
      body: UPDATE_PROJECT_SCHEMA,
    },
    handler: async (request, reply) => {
      const { userId = "" } = request.user || {};
      const { id } = request.params;
      const projectId = parseInt(id);

      const input = request.body;

      const result = await updateProject(projectId, input, userId, prisma);
      return reply.send({
        data: result,
        message: "Project updated successfully",
      });
    },
  });

  // Delete project
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "DELETE",
    url: "/:id",
    schema: {
      params: PROJECT_ID_PARAM_SCHEMA,
    },
    handler: async (request, reply) => {
      const { userId = "" } = request.user || {};
      const { id } = request.params;
      const projectId = parseInt(id);

      await deleteProject(projectId, userId, prisma);
      return reply.send({
        message: "Project deleted successfully",
      });
    },
  });
};

export default projectRoutes;
