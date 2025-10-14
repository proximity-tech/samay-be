import { CronJob, AsyncTask } from "toad-scheduler";
import { FastifyInstance } from "fastify";
import { Activity } from "@prisma/client";

// Interface for the aggregated result
interface AggregatedActivity {
  userId: string;
  app: string;
  title: string;
  selected: boolean;
  duration: number;
  timestamp: string;
  url: string;
  merged: boolean;
  projectId: number | null;
  mergedTimestamp: string;
}

const mergeActivities = (
  activities: Partial<Activity>[]
): { activities: AggregatedActivity[]; allIds: string[] } => {
  // Group by userId, app, title, selected and aggregate duration
  const groupedData: Record<string, AggregatedActivity> = {};
  const allIds: string[] = [];
  activities.forEach((activity) => {
    const {
      userId = "",
      app = "",
      title = "",
      selected = false,
      duration = 0,
      id = "",
      timestamp = "",
      url = "",
      projectId = null,
    } = activity;

    if (!userId || !app || !title) {
      return { activities: [], allIds: [] };
    }

    const key = `${userId}|${app}|${title}|${selected}`;
    allIds.push(id);

    const mergedTimestamp =
      timestamp && duration ? `${timestamp}|${duration}` : "";

    if (groupedData[key]) {
      // Add duration to existing group
      groupedData[key].duration += duration || 0;
      groupedData[key].url += url ? `,${url}` : "";
      groupedData[key].mergedTimestamp += mergedTimestamp
        ? `,${mergedTimestamp}`
        : "";
    } else {
      // Create new group
      groupedData[key] = {
        userId,
        app,
        title,
        selected,
        duration: duration || 0,
        timestamp,
        url: url ? `${url}` : "",
        merged: true,
        projectId,
        mergedTimestamp: mergedTimestamp || "",
      };
    }
  });

  // Convert grouped data to array
  return { activities: Object.values(groupedData), allIds };
};

export const createEventsMergeJob = (fastify: FastifyInstance) => {
  const task = new AsyncTask(
    "events merge task",
    async () => {
      console.log("Starting events merge task");

      try {
        const activities = await fastify.prisma.activity.findMany({
          where: {
            merged: false,
          },
          select: {
            id: true,
            userId: true,
            app: true,
            title: true,
            selected: true,
            timestamp: true,
            duration: true,
            projectId: true,
          },
        });

        const { activities: result, allIds } = mergeActivities(activities);
        // create result activities in db with merged true and remove allids from db do these in transaction
        await fastify.prisma.$transaction(async (tx) => {
          await tx.activity.createMany({
            data: result,
          });
          await tx.activity.deleteMany({ where: { id: { in: allIds } } });
        });
      } catch (error) {
        console.error("Error in events merge task:", error);
        throw error;
      }
    },
    (err: Error) => {
      console.error("Events merge task error:", err);
    }
  );

  return new CronJob({ cronExpression: "0 2 * * *" }, task);
};
