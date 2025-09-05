import { Activity, PrismaClient } from "@prisma/client";
import {
  ActivityError,
  ActivityResponse,
  CreateActivityInput,
  UpdateActivityInput,
} from "./types";

/**
 * Create a new activity
 */
export async function createActivity(
  activities: CreateActivityInput,
  userId: string,
  prisma: PrismaClient
): Promise<ActivityResponse> {
  const activity = await prisma.activity.create({
    data: {
      ...activities,
      userId,
    },
  });

  return activity;
}

/**
 * Get all activities for a user with pagination and filtering
 */
export async function getActivities(
  userId: string,
  query: {
    startDate?: string;
    endDate?: string;
  },
  prisma: PrismaClient
): Promise<Activity[]> {
  const { startDate, endDate } = query;

  const activities = await prisma.activity.findMany({
    where: {
      userId,
      createdAt: {
        gte: new Date(startDate || ""),
        lte: new Date(endDate || ""),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return activities;
}

/**
 * Update an activity
 */
export async function updateActivity(
  id: string,
  input: UpdateActivityInput,
  userId: string,
  prisma: PrismaClient
): Promise<ActivityResponse> {
  // Check if activity exists and belongs to user
  const existingActivity = await prisma.activity.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!existingActivity) {
    throw new ActivityError("Activity not found", 404, "ACTIVITY_NOT_FOUND");
  }

  const activity = await prisma.activity.update({
    where: { id },
    data: input,
  });

  return activity;
}

/**
 * Delete an activity
 */
export async function deleteActivity(
  id: string,
  userId: string,
  prisma: PrismaClient
): Promise<void> {
  // Check if activity exists and belongs to user
  const existingActivity = await prisma.activity.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!existingActivity) {
    throw new ActivityError("Activity not found", 404, "ACTIVITY_NOT_FOUND");
  }

  await prisma.activity.delete({
    where: { id },
  });
}

/**
 * Get activity statistics for a user
 */
export async function getActivityStats(
  userId: string,
  prisma: PrismaClient
): Promise<{
  totalActivities: number;
  totalDuration: number;
  topApps: Array<{ app: string; count: number }>;
  recentActivity: ActivityResponse | null;
}> {
  const [totalActivities, totalDuration, topApps, recentActivity] =
    await Promise.all([
      prisma.activity.count({ where: { userId } }),
      prisma.activity.aggregate({
        where: { userId },
        _sum: { duration: true },
      }),
      prisma.activity.groupBy({
        by: ["app"],
        where: { userId },
        _count: { app: true },
        orderBy: { _count: { app: "desc" } },
        take: 5,
      }),
      prisma.activity.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return {
    totalActivities,
    totalDuration: totalDuration._sum.duration || 0,
    topApps: topApps.map((item) => ({
      app: item.app,
      count: item._count.app,
    })),
    recentActivity,
  };
}
