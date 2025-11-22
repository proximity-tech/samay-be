import { z } from "zod";

export const getDailyInsightSchema = {
  querystring: z.object({
    date: z.string().optional().describe("Date in ISO format (YYYY-MM-DD)"),
  }),
  response: {
    200: z.object({
      data: z.object({
        dailyInsights: z.array(z.string()),
        improvementPlan: z.array(z.string()),
        date: z.string(),
      }),
    }),
    404: z.object({
      message: z.string(),
    }),
  },
};
