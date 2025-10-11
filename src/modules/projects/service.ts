import { PrismaClient } from "@prisma/client";
import {
  ProjectResponse,
  CreateProjectInput,
  UpdateProjectInput,
} from "./types";

/**
 * Create a new project
 */
export async function createProject(
  prisma: PrismaClient,
  input: CreateProjectInput
): Promise<ProjectResponse> {
  const project = await prisma.project.create({
    data: {
      ...input,
      icon: input.icon || "",
    },
  });

  return project;
}

/**
 * Get all projects for a user with pagination and search
 */
export async function getProjects(
  prisma: PrismaClient,
  userId: string,
  isAdmin: boolean
): Promise<ProjectResponse[]> {
  const [projects] = await Promise.all([
    prisma.project.findMany({
      where: isAdmin ? undefined : { users: { some: { userId } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return projects;
}

/**
 * Get a single project by ID
 */
export async function getProject(
  prisma: PrismaClient,
  userId: string,
  isAdmin: boolean,
  id: number
): Promise<ProjectResponse | null> {
  const project = await prisma.project.findFirst({
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      createdAt: true,
      updatedAt: true,
      users: {
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    where: isAdmin ? { id } : { id, users: { some: { userId } } },
  });

  return project;
}

/**
 * Update a project
 */
export async function updateProject(
  prisma: PrismaClient,
  id: number,
  input: UpdateProjectInput
): Promise<ProjectResponse> {
  const project = await prisma.project.update({
    where: { id },
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
  prisma: PrismaClient,
  id: number
): Promise<void> {
  await prisma.project.delete({
    where: { id },
  });
}
