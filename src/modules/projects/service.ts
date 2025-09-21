import { Project, PrismaClient } from "@prisma/client";
import {
  ProjectResponse,
  CreateProjectInput,
  UpdateProjectInput,
} from "./types";

/**
 * Create a new project
 */
export async function createProject(
  input: CreateProjectInput,
  userId: string,
  prisma: PrismaClient
): Promise<ProjectResponse> {
  const project = await prisma.project.create({
    data: {
      ...input,
      userId,
    },
  });

  return project;
}

/**
 * Get all projects for a user with pagination and search
 */
export async function getProjects(
  userId: string,
  query: {
    page?: string;
    limit?: string;
    search?: string;
  },
  prisma: PrismaClient
): Promise<{
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "10");
  const skip = (page - 1) * limit;

  const whereClause = {
    userId,
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: "insensitive" as const } },
        {
          description: { contains: query.search, mode: "insensitive" as const },
        },
      ],
    }),
  };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.project.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    projects,
    total,
    page,
    limit,
    totalPages,
  };
}

/**
 * Get a single project by ID
 */
export async function getProject(
  id: number,
  userId: string,
  prisma: PrismaClient
): Promise<ProjectResponse | null> {
  const project = await prisma.project.findFirst({
    where: { id, userId },
  });

  return project;
}

/**
 * Update a project
 */
export async function updateProject(
  id: number,
  input: UpdateProjectInput,
  userId: string,
  prisma: PrismaClient
): Promise<ProjectResponse> {
  const project = await prisma.project.update({
    where: { id, userId },
    data: {
      ...input,
      updatedAt: new Date(),
    },
  });

  return project;
}

/**
 * Delete a project
 */
export async function deleteProject(
  id: number,
  userId: string,
  prisma: PrismaClient
): Promise<void> {
  await prisma.project.delete({
    where: { id, userId },
  });
}

/**
 * Get project statistics for a user
 */
export async function getProjectStats(
  userId: string,
  prisma: PrismaClient
): Promise<{
  totalProjects: number;
  recentProjects: ProjectResponse[];
}> {
  const [totalProjects, recentProjects] = await Promise.all([
    prisma.project.count({ where: { userId } }),
    prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    totalProjects,
    recentProjects,
  };
}
