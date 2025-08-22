import fp from "fastify-plugin";
import jwt from "jsonwebtoken";
import { FastifyPluginAsync } from "fastify";
import { publicRoutes } from "./routes";
import { JWTPayload } from "./types";

declare module "fastify" {
  interface FastifyRequest {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user?: JWTPayload;
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const authMiddleware: FastifyPluginAsync = fp(async (fastify) => {
  console.log("Auth middleware initialized");
  fastify.addHook("preHandler", async (request, reply) => {
    const url = request.raw.url || "";
    const method = request.raw.method || "GET";
    if (publicRoutes.includes(url)) {
      return; // Skip authentication for public routes
    }
    try {
      const authHeader = request.headers.authorization;
      console.log({ headers: request.headers });
      if (!authHeader) throw new Error();
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      if (decoded.role == "USER") {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        if (adminRoutes[method]?.[url]) {
          return reply.status(403).send({ error: "Forbidden" });
        }
      }
      request.user = decoded;
    } catch {
      reply.status(401).send({ error: "Unauthorized" });
    }
  });
});

export default authMiddleware;
