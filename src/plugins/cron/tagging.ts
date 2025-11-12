import { CronJob, AsyncTask } from "toad-scheduler";
import { FastifyInstance } from "fastify";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const tagItemSchema = z.object({
  app: z.string(),
  title: z.string(),
  tag: z.enum([
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
    "Not Related to Work",
  ]),
});

const tagsResponseSchema = z.object({
  tags: z.array(tagItemSchema),
});

export const createTaggingJob = (fastify: FastifyInstance) => {
  const task = new AsyncTask(
    "tagging task",
    async () => {
      console.log("Starting tagging task");

      try {
        const activities = await fastify.prisma.activity.groupBy({
          by: ["app", "title", "url"],
          where: {
            isAutoTagged: false,
          },
        });

        const existingTags = await fastify.prisma.tag.findMany({
          where: {
            app: {
              in: activities.map((activity) => activity.app),
            },
          },
        });

        const newTags = activities.filter(
          (activity) =>
            !existingTags.some(
              (tag) =>
                tag.app === activity.app &&
                (tag.title === activity.title || tag.title === "any")
            )
        );
        console.log(`Found ${newTags.length} activities to tag`);

        // Process activities in batches of 25
        const batchSize = 25;
        const allTags: Array<{
          app: string;
          title: string;
          tag: string;
        }> = [];

        for (let i = 0; i < newTags.length; i += batchSize) {
          const batch = newTags.slice(i, i + batchSize);
          console.log(
            `Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(
              newTags.length / batchSize
            )} (${batch.length} activities)`
          );

          try {
            const taggedActivities = await openai.chat.completions.parse({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content:
                    "You are a helpful assistant that tags activities based on app title and url. Return a JSON object with a 'tags' array containing one tag object for each activity. Each tag object should have 'app', 'title', and 'tag' fields. The 'tag' field must be one of: Code, Discussion, Meeting, Design, Research, Entertainment, Social Media, Documentation, Learning, Mail, Not Related to Work",
                },
                {
                  role: "user",
                  content: `Tag the following activities (return one tag per activity): ${batch
                    .map(
                      (activity, index) =>
                        `${index + 1}. ${activity.app} - ${activity.title} - ${
                          activity.url
                        }`
                    )
                    .join("\n")}`,
                },
              ],
              response_format: zodResponseFormat(tagsResponseSchema, "tags"),
            });

            const batchTags = taggedActivities.choices[0].message.parsed.tags;
            allTags.push(...batchTags);
            console.log(
              `Successfully tagged ${batchTags.length} activities in this batch`
            );
          } catch (error) {
            console.error(
              `Error processing batch ${Math.floor(i / batchSize) + 1}:`,
              error
            );
            // Continue processing other batches even if one fails
          }
        }

        console.log(`Total tags generated: ${allTags.length}`);
        console.log(allTags);
      } catch (error) {
        console.error("Error in tagging task:", error);
        throw error;
      }
    },
    (err: Error) => {
      console.error("Events merge task error:", err);
    }
  );

  return new CronJob({ cronExpression: "*/10 * * * *" }, task);
};
