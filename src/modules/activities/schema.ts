import { z } from "zod";

export const EVENT_DATA_SCHEMA = z.object({
  app: z.string().min(1, "App name is required"),
  url: z.string("URL is required").default(""),
  title: z.string().default(""),
});

export const CREATE_ACTIVITY_SCHEMA = z.object({
  data: EVENT_DATA_SCHEMA,
  timestamp: z.string().min(1, "Timestamp is required"),
  duration: z.number().default(0),
});

export const UPDATE_ACTIVITY_SCHEMA = z.object({
  data: EVENT_DATA_SCHEMA.optional(),
  timestamp: z.string().min(1, "Timestamp is required").optional(),
  duration: z.number().default(0),
  description: z.string().optional(),
});

export const ACTIVITY_ID_PARAM_SCHEMA = z.object({
  id: z.string().min(1, "Activity ID is required"),
});

export const ACTIVITIES_QUERY_SCHEMA = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const STATS_BY_DAY_QUERY_SCHEMA = z.object({
  date: z.string().min(1, "Date is required"),
});
