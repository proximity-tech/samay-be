import { z } from "zod";

export const CREATE_PROJECT_SCHEMA = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  icon: z.string().optional(),
});

export const UPDATE_PROJECT_SCHEMA = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be less than 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  icon: z.string().optional(),
});

export const PROJECT_ID_PARAM_SCHEMA = z.object({
  id: z.string().min(1, "Project ID is required"),
});
