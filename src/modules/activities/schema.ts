import { z } from "zod";

export const CREATE_ACTIVITY_SCHEMA = z.object({
  app: z.string().min(1, "App name is required"),
  url: z.url("Invalid URL format"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  timestamp: z.string().min(1, "Timestamp is required"),
  duration: z.number().int().positive().optional(),
});

export const UPDATE_ACTIVITY_SCHEMA = z.object({
  app: z.string().min(1, "App name is required").optional(),
  url: z.url("Invalid URL format").optional(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  timestamp: z.string().min(1, "Timestamp is required").optional(),
  duration: z.number().int().positive().optional(),
});

export const ACTIVITY_ID_PARAM_SCHEMA = z.object({
  id: z.string().min(1, "Activity ID is required"),
});

export const ACTIVITIES_QUERY_SCHEMA = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
