import { CronJob, AsyncTask } from "toad-scheduler";
import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { z } from "zod/v3";
import { zodResponseFormat } from "openai/helpers/zod";


// Run every day at 00:01
const CRON_EXPRESSION = "1 0 * * *";
const EXCLUDED_APPS = ["loginwindow", "dock"];

const OPENAI_ACTIVITY_MODEL =
  process.env.OPENAI_ACTIVITY_SUMMARY_MODEL || "gpt-5-mini";

const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

const activitySummaryResponseSchema = z.object({
  dailyInsights: z.array(z.string()).min(4).max(5).describe("Summary of what user was doing yesterday which can be used for sharing in DSM / resume work"),
  improvementPlan: z.array(z.string()).describe("How can he improve today based on yesterday's data to make himself more productive"),
});

const ACTIVITY_SUMMARY_SYSTEM_PROMPT = `You are an expert productivity coach. Analyze the user's computer activities from yesterday and their stated goals to provide daily insights.

Generate:
1. **Daily Insights + Action Items**: 4-5 bullet points summarizing what the user was doing yesterday. This should be suitable for sharing in a Daily Standup Meeting (DSM) or for resuming work.
2. **Improvement Plan**: Actionable advice on how to improve today based on yesterday's data (e.g., reducing distractions, better focus blocks).
  
  Analyze the user's context switching patterns using the provided timestamps. High frequency of switching between unrelated apps indicates fragmentation.

  **NOTE**: All timestamps provided in the data are already converted to Indian Standard Time (IST). Use them directly in your response.
  
  **CONSTRAINT**: Keep each bullet point in "Daily Insights" and "Improvement Plan" concise, between 30-40 words maximum.
  
  Be specific, encouraging, and data-driven.`;

interface TopActivityResponse {
  app: string;
  title: string;
  duration: number;
  tag: string;
  mergedTimestamp?: string;
}

function convertToIST(utcDateString: string): string {
  try {
    const date = new Date(utcDateString);
    return date.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch (e) {
    return utcDateString;
  }
}

function formatActivitiesForPrompt(activities: TopActivityResponse[]): string {
  const totalDuration = activities.reduce(
    (sum, activity) => sum + (activity.duration || 0),
    0
  );

  return activities
    .map((activity, index) => {
      const durationMinutes = Math.round((activity.duration || 0) / 60);
      const durationHours =
        Math.round(((activity.duration || 0) / 3600) * 10) / 10;
      const percentage = Math.round(
        ((activity.duration || 0) / totalDuration) * 100
      );
      const tag = activity.tag ? `[${activity.tag}]` : "[Untagged]";
      
      let timestamps = "";
      if (activity.mergedTimestamp) {
        const parts = activity.mergedTimestamp.split(",").filter(p => p.trim().length > 0);
        // Limit to first 20 timestamps to avoid token limit issues if there are too many
        const limitedParts = parts.slice(0, 20); 
        const formattedParts = limitedParts.map(part => {
            const [ts, dur] = part.split("|");
            if (!ts) return "";
            return `${convertToIST(ts)} (${dur}s)`;
        }).filter(Boolean);
        
        timestamps = `\n   Timestamps (IST): ${formattedParts.join(", ")}${parts.length > 20 ? "..." : ""}`;
      }
      
      return `${index + 1}. ${activity.app} → "${activity.title}" ${tag}
   Duration: ${durationHours}h (${durationMinutes}min) | ${percentage}% of time${timestamps}`;
    })
    .join("\n\n");
}

async function getTopActivities(
  userId: string,
  query: {
    startDate?: string;
    endDate?: string;
  },
  prisma: PrismaClient
): Promise<TopActivityResponse[]> {
  const { startDate, endDate } = query;

  const topActivities = await prisma.activity.groupBy({
    by: ["app", "title", "autoTags", "mergedTimestamp"],
    where: {
      userId,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
      app: { notIn: EXCLUDED_APPS },
    },
    _sum: { duration: true },
    orderBy: { _sum: { duration: "desc" } },
    take: 100, // Increased to get more context
  });

  return topActivities.map((item) => ({
    app: item.app,
    title: item.title,
    duration: item._sum?.duration || 0,
    tag: item.autoTags || "",
    mergedTimestamp: item.mergedTimestamp || undefined,
  }));
}

/**
 * Generate insights for a specific user for a given date range
 */
async function generateUserInsights(
  userId: string,
  startDate: string,
  endDate: string,
  prisma: PrismaClient
) {
  const activities = await getTopActivities(
    userId,
    {
      startDate,
      endDate,
    },
    prisma
  );

  if (!activities || activities.length === 0) {
    return {
      dailyInsights: ["No activities recorded for yesterday."],
      improvementPlan: ["Ensure your activity tracker is running to get insights."],
    };
  }

  if (!openaiClient) {
    throw new Error("OpenAI client is not configured");
  }

  const totalDuration = activities.reduce(
    (sum, activity) => sum + (activity.duration || 0),
    0
  );
  
  const userPrompt = `ACTIVITY ANALYSIS DATA:
Date range: ${startDate} -> ${endDate}
Total duration tracked: ${Math.round(totalDuration / 60)} minutes

TOP ACTIVITIES (by duration):
${formatActivitiesForPrompt(activities)}

ANALYSIS REQUIREMENTS:
Based on the activities above, generate the requested insights and improvement plan.
REMINDER: The provided timestamps are in IST. Use them as is.`;

  try {
    const completion = await openaiClient.chat.completions.parse({
      model: OPENAI_ACTIVITY_MODEL,
      messages: [
        {
          role: "system",
          content: ACTIVITY_SUMMARY_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      response_format: zodResponseFormat(
        activitySummaryResponseSchema,
        "activity_summary"
      ),
    });

    const parsed = completion.choices?.[0]?.message?.parsed;

    return {
      dailyInsights: parsed?.dailyInsights || [],
      improvementPlan: parsed?.improvementPlan || [],
    };
  } catch (error) {
    console.error("Failed to generate activity summary via OpenAI:", error);
    return {
      dailyInsights: ["Error generating insights."],
      improvementPlan: [],
    };
  }
}

export async function executeDailyInsightsTask(fastify: FastifyInstance): Promise<void> {
  console.log("Starting daily insights task");

  try {
    // Get all users
    const users = await fastify.prisma.user.findMany();
    console.log(`Found ${users.length} users to process`);

    // Calculate yesterday's date range
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Set to start of day (00:00:00)
    yesterday.setHours(0, 0, 0, 0);
    const startDate = yesterday.toISOString();
    
    // Set to end of day (23:59:59.999)
    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);
    const endDate = endOfYesterday.toISOString();

    console.log(`Generating insights for period: ${startDate} to ${endDate}`);

    for (const user of users) {
      try {
        console.log(`Processing user ${user.id} (${user.email})`);
        
        const summary = await generateUserInsights(
          user.id,
          startDate,
          endDate,
          fastify.prisma
        );

        // Only save to database if insights were successfully generated
        if (summary.dailyInsights.length > 0 && 
            !summary.dailyInsights.includes("No activities recorded for yesterday.") &&
            !summary.dailyInsights.includes("Error generating insights.")) {
          
          // Normalize the date to remove time component for unique constraint matching
          const normalizedDate = new Date(startDate);
          normalizedDate.setHours(0, 0, 0, 0);
          
          // Save to database (upsert to override if exists)
          await fastify.prisma.dailyInsight.upsert({
            where: {
              userId_date: {
                userId: user.id,
                date: normalizedDate,
              },
            },
            update: {
              dailyInsights: summary.dailyInsights,
              improvementPlan: summary.improvementPlan,
            },
            create: {
              userId: user.id,
              dailyInsights: summary.dailyInsights,
              improvementPlan: summary.improvementPlan,
              date: new Date(startDate),
            },
          });
        }


      } catch (err) {
        console.error(`Error processing user ${user.id}:`, err);
        // Continue with next user
      }
    }

    console.log("Daily insights task completed");
  } catch (error) {
    console.error("Error in daily insights task:", error);
    throw error;
  }
}

export const createDailyInsightsJob = (fastify: FastifyInstance) => {
  const taskFunction = () => executeDailyInsightsTask(fastify);

  // Run immediately
  taskFunction().catch((err) => {
    console.error("Immediate daily insights task error:", err);
  });

  const task = new AsyncTask(
    "daily insights task",
    taskFunction,
    (err: Error) => {
      console.error("Daily insights task error:", err);
    }
  );

  return new CronJob({ cronExpression: CRON_EXPRESSION }, task);
};
