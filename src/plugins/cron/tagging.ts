import { CronJob, AsyncTask } from "toad-scheduler";
import { FastifyInstance } from "fastify";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod/v3";
import { PrismaClient, Prisma } from "@prisma/client";

// Constants
const BATCH_SIZE = 25;
const CRON_EXPRESSION = "0 */6 * * *";
const OPENAI_MODEL = "gpt-4o-mini";

const TAG_OPTIONS = [
  "Code",
  "Discussion",
  "Meeting",
  "Design",
  "Research",
  "Entertainment",
  "Social Media",
  "Documentation",
  "Learning",
  "Mail",
  "Misc",
] as const;

const SYSTEM_PROMPT = `You are a helpful assistant that tags activities based on app title and url. Return a JSON object with a 'tags' array containing one tag object for each activity. Each tag object should have 'app', 'title', and 'tag' fields. Use the exact 'app' and 'title' values provided without rewriting them. The 'tag' field must be one of: ${TAG_OPTIONS.join(
  ", "
)}`;

// Schemas
const tagItemSchema = z.object({
  app: z.string(),
  title: z.string(),
  tag: z.enum(TAG_OPTIONS),
});

type TagItem = z.infer<typeof tagItemSchema>;

const tagsResponseSchema = z.object({
  tags: z.array(tagItemSchema),
});

// Types
interface ActivityGroup {
  app: string;
  title: string;
  url: string | null;
}

interface TagData {
  app: string;
  title: string;
  tag: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Fetch activities that need tagging
 */
async function getUntaggedActivities(
  prisma: PrismaClient
): Promise<ActivityGroup[]> {
  const result = await prisma.activity.groupBy({
    by: ["app", "title", "url"],
    where: {
      isAutoTagged: false,
    },
  });
  return result as ActivityGroup[];
}

/**
 * Filter out activities that already have tags
 */
async function filterNewActivities(
  activities: ActivityGroup[],
  prisma: PrismaClient
): Promise<ActivityGroup[]> {
  if (activities.length === 0) {
    return [];
  }

  const existingTags = await prisma.tag.findMany({
    where: {
      app: {
        in: activities.map((activity) => activity.app),
      },
    },
  });

  return activities.filter(
    (activity) =>
      !existingTags.some(
        (tag) =>
          tag.app === activity.app &&
          (tag.title === activity.title || tag.title === "any")
      )
  );
}

/**
 * Create user prompt for tagging activities
 */
function createUserPrompt(batch: ActivityGroup[]): string {
  const activitiesList = batch
    .map(
      (activity, index) =>
        `${index + 1}. ${activity.app} - ${activity.title} - ${
          activity.url || "N/A"
        }`
    )
    .join("\n");

  return `Tag the following activities (return one tag per activity):\n${activitiesList}`;
}

/**
 * Normalize tags from OpenAI response to match activity structure
 */
function normalizeBatchTags(
  batch: ActivityGroup[],
  batchTags: TagItem[]
): TagData[] {
  return batch.reduce<TagData[]>((acc, activity, index) => {
    const tag = batchTags[index]?.tag;
    if (!tag) {
      console.warn(
        `Missing tag for activity at index ${index} (${activity.app} - ${activity.title}). Skipping.`
      );
      return acc;
    }

    acc.push({
      app: activity.app,
      title: activity.title,
      tag,
    });

    return acc;
  }, []);
}

/**
 * Process a single batch of activities through OpenAI
 */
async function processBatch(
  batch: ActivityGroup[],
  batchNumber: number,
  totalBatches: number
): Promise<TagData[]> {
  console.log(
    `Processing batch ${batchNumber} of ${totalBatches} (${batch.length} activities)`
  );

  try {
    const response = await openai.chat.completions.parse({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: createUserPrompt(batch),
        },
      ],
      response_format: zodResponseFormat(tagsResponseSchema, "tags"),
    });

    const batchTags = response?.choices?.[0]?.message?.parsed?.tags || [];

    const normalizedTags = normalizeBatchTags(batch, batchTags);

    console.log(
      `Successfully tagged ${normalizedTags.length} activities in batch ${batchNumber}`
    );

    return normalizedTags;
  } catch (error) {
    console.error(`Error processing batch ${batchNumber}:`, error);
    throw error;
  }
}

/**
 * Process all activities in batches
 */
async function processAllBatches(
  activities: ActivityGroup[]
): Promise<TagData[]> {
  if (activities.length === 0) {
    return [];
  }

  const allTags: TagData[] = [];
  const totalBatches = Math.ceil(activities.length / BATCH_SIZE);

  for (let i = 0; i < activities.length; i += BATCH_SIZE) {
    const batch = activities.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

    try {
      const batchTags = await processBatch(batch, batchNumber, totalBatches);
      allTags.push(...batchTags);
    } catch {
      console.error(
        `Failed to process batch ${batchNumber}, continuing with next batch...`
      );
      // Continue processing other batches even if one fails
    }
  }

  return allTags;
}

/**
 * Save tags and update activities in a single batch
 */
async function saveTagsAndUpdateActivities(
  prisma: PrismaClient,
  tags: TagData[]
): Promise<void> {
  if (tags.length === 0) {
    console.log("No tags to save");
    return;
  }

  // Step 1: Save all tags to database in a single batch
  await prisma.tag.createMany({
    data: tags,
    skipDuplicates: true, // Skip if tag already exists
  });

  console.log(`Saved ${tags.length} tags to database`);

  // Step 2: Update all matching activities in parallel batches
  const updatePromises: Promise<{ count: number }>[] = [];

  for (const tagData of tags) {
    // Build where condition for activities
    const whereCondition: Prisma.ActivityWhereInput = {
      app: tagData.app,
      OR: [{ isAutoTagged: false }, { autoTags: null }, { autoTags: "" }],
    };

    // If title is "any", match all activities with that app
    // Otherwise, match activities with the exact title
    if (tagData.title !== "any") {
      whereCondition.title = tagData.title;
    }

    // Add update operation to batch
    updatePromises.push(
      prisma.activity.updateMany({
        where: whereCondition,
        data: {
          autoTags: tagData.tag,
          isAutoTagged: true,
        },
      })
    );
  }

  // Execute all activity updates in parallel
  const updateResults = await Promise.all(updatePromises);
  const totalUpdated = updateResults.reduce(
    (sum, result) => sum + result.count,
    0
  );

  if (totalUpdated > 0) {
    console.log(`Updated ${totalUpdated} untagged activities with tags`);
  }
}

/**
 * Main tagging task function
 */
async function executeTaggingTask(fastify: FastifyInstance): Promise<void> {
  console.log("Starting tagging task");

  try {
    const activities = await getUntaggedActivities(fastify.prisma);
    console.log(`Found ${activities.length} untagged activity groups`);

    const newActivities = await filterNewActivities(activities, fastify.prisma);
    console.log(`Found ${newActivities.length} activities to tag`);

    if (newActivities.length === 0) {
      console.log("No new activities to tag");
      return;
    }

    const allTags = await processAllBatches(newActivities);
    console.log(`Total tags generated: ${allTags.length}`);

    // Save tags and update activities in a single batch transaction
    await saveTagsAndUpdateActivities(fastify.prisma, allTags);
    console.log("Tagging task completed successfully");
  } catch (error) {
    console.error("Error in tagging task:", error);
    throw error;
  }
}

export const createTaggingJob = (fastify: FastifyInstance) => {
  const taskFunction = () => executeTaggingTask(fastify);

  const task = new AsyncTask("tagging task", taskFunction, (err: Error) => {
    console.error("Tagging task error:", err);
  });

  // Execute immediately
  taskFunction().catch((err: Error) => {
    console.error("Error executing tagging task immediately:", err);
  });

  return new CronJob({ cronExpression: CRON_EXPRESSION }, task);
};
