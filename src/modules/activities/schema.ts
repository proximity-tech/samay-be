import { z } from "zod";

// Helper function to sanitize strings in schema validation
const sanitizeString = z.string().transform((str) => {
  if (!str) return str;

  // Remove null bytes and other control characters that can cause UTF-8 issues
  return str
    .split("")
    .filter((char) => {
      const code = char.charCodeAt(0);
      // Keep printable characters and common whitespace (space, tab, newline, carriage return)
      return code >= 32 || code === 9 || code === 10 || code === 13;
    })
    .join("")
    .trim(); // Remove leading/trailing whitespace
});

export const EVENT_DATA_SCHEMA = z.object({
  app: sanitizeString.optional().default(""),
  url: sanitizeString.default(""),
  title: sanitizeString.default(""),
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
  description: sanitizeString.optional(),
});

export const ACTIVITY_ID_PARAM_SCHEMA = z.object({
  id: z.string().min(1, "Activity ID is required"),
});

export const ACTIVITIES_QUERY_SCHEMA = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  selected: z.string().transform((value) => {
    if (value === "true") {
      return true;
    } else if (value === "false") {
      return false;
    } else {
      return undefined;
    }
  }).optional(),
});

export const STATS_BY_DAY_QUERY_SCHEMA = z.object({
  date: z.string().min(1, "Date is required"),
});

export const TOP_ACTIVITIES_QUERY_SCHEMA = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const SELECT_ACTIVITIES_SCHEMA = z.object({
  activityIds: z.array(z.string().min(1, "Activity ID is required")),
  selected: z.boolean().default(false),
});

export const ADD_PROJECT_SCHEMA = z.object({
  activityIds: z.array(z.string().min(1, "Activity ID is required")),
  projectId: z.number().min(1, "Project ID is required"),
});

export const USER_SELECT_DATA_QUERY_SCHEMA = z.object({
  startDate: z.string(),
  endDate: z.string(),
});
