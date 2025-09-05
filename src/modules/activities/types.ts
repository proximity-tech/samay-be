import { z } from "zod";
import { CREATE_ACTIVITY_SCHEMA, UPDATE_ACTIVITY_SCHEMA } from "./schema";

export type CreateActivityInput = z.infer<typeof CREATE_ACTIVITY_SCHEMA>;
export type UpdateActivityInput = z.infer<typeof UPDATE_ACTIVITY_SCHEMA>;

// Activity interface (partial of Prisma Activity)
export interface ActivityResponse {
  id: string;
  userId: string;
  app: string;
  url: string;
  title: string;
  description: string | null;
  timestamp: string;
  duration: number | null;
  createdAt: Date;
  updatedAt: Date;
}
