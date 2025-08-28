import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { publicRoutes, adminRoutes } from "./routes";
import { JWTPayload } from "./types";
import { AuthService } from "../services/auth-service";

declare module "fastify" {
  interface FastifyRequest {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user?: JWTPayload;
  }
}

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
      if (!authHeader) throw new Error("No authorization header");
      
      const token = authHeader.split(" ")[1];
      if (!token) throw new Error("No token provided");
      
      const user = await AuthService.validateToken(token, fastify.prisma);
      if (!user) throw new Error("Invalid token");
      
      const payload: JWTPayload = {
        userId: user.id,
        role: user.role,
      };
      
      // Check admin routes access
      if (payload.role === "USER") {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        if (adminRoutes[method]?.[url]) {
          return reply.status(403).send({ error: "Forbidden" });
        }
      }
      
      request.user = payload;
    } catch (error) {
      reply.status(401).send({ error: "Unauthorized" });
    }
  });
});

export default authMiddleware;
