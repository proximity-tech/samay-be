import { Activity, PrismaClient } from "@prisma/client";
import {
  ActivityResponse,
  CreateActivityInput,
  UpdateActivityInput,
  TopActivityResponse,
} from "./types";

const EXCLUDED_APPS = ["loginwindow", "dock"];

/**
 * Create a new activity
 */
export async function createActivity(
  activities: CreateActivityInput[],
  userId: string,
  prisma: PrismaClient
) {
  const mappedActivities = activities
    .map((activity) => {
      const { data, timestamp, duration } = activity;
      return {
        ...data,
        timestamp,
        duration,
        userId,
      };
    })
    .filter((activity) => {
      return !EXCLUDED_APPS.includes(activity.app) && activity.duration > 0;
    });

  await prisma.activity.createMany({
    data: mappedActivities,
  });

  return;
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
  const { data = {}, timestamp, duration, description } = input;
  const activity = await prisma.activity.update({
    where: { id, userId },
    data: {
      ...data,
      timestamp,
      duration,
      description,
    },
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
  await prisma.activity.delete({
    where: { id, userId },
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
  topApps: Array<{ app: string; duration: number }>;
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
        _sum: { duration: true },
        orderBy: { _sum: { duration: "desc" } },
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
      duration: item._sum.duration || 0,
    })),
    recentActivity,
  };
}

/**
 * Get activity statistics for a specific day
 */
export async function getAppStatsByDay(
  userId: string,
  date: string,
  prisma: PrismaClient
): Promise<{
  totalDuration: number;
  topApps: Array<{ app: string; duration: number }>;
}> {
  // Create date range for the specific day
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const apps = await prisma.activity.groupBy({
    by: ["app"],
    where: {
      userId,
      createdAt: {
        gte: dayStart,
        lte: dayEnd,
      },
      app: { notIn: EXCLUDED_APPS },
    },
    _sum: { duration: true },

    orderBy: { _sum: { duration: "desc" } },
  });
  const totalDuration = apps.reduce(
    (acc, item) => acc + (item._sum?.duration || 0),
    0
  );
  // Get aggregated data for the day

  return {
    totalDuration: totalDuration || 0,
    topApps: apps.map((item) => ({
      app: item.app,
      duration: item._sum?.duration || 0,
    })),
  };
}

/**
 * Get top activities grouped by app and title
 */
export async function getTopActivities(
  userId: string,
  query: {
    startDate?: string;
    endDate?: string;
  },
  prisma: PrismaClient
): Promise<TopActivityResponse[]> {
  const { startDate, endDate } = query;

  // Create proper date range with time boundaries
  const dateFilter: Record<string, Date> = {};

  if (startDate) {
    const dayStart = new Date(startDate);
    dayStart.setHours(0, 0, 0, 0);
    dateFilter.gte = dayStart;
  }

  if (endDate) {
    const dayEnd = new Date(endDate);
    dayEnd.setHours(23, 59, 59, 999);
    dateFilter.lte = dayEnd;
  }

  const topActivities = await prisma.activity.groupBy({
    by: ["app", "title"],
    where: {
      userId,
      createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      app: { notIn: EXCLUDED_APPS },
    },
    _sum: { duration: true },
    orderBy: { _sum: { duration: "desc" } },
    take: 20,
  });

  return topActivities.map((item) => ({
    app: item.app,
    title: item.title,
    duration: item._sum?.duration || 0,
  }));
}
