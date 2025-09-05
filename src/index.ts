import Fastify from "fastify";
import fastifySwagger from "@fastify/swagger";
import cors from "@fastify/cors";
import fastifySwaggerUI from "@fastify/swagger-ui";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import prismaPlugin from "./plugins/prisma-plugin";
import authMiddleware from "./middleware/auth";
import authRoutes from "./modules/auth/routes";
import activityRoutes from "./modules/activities/routes";
const app = Fastify({
  logger: true,
});

app.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

app.register(prismaPlugin);

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Samay backend API",
      description: "This is the API documentation for the Samay backend.",
      version: "1.0.0",
    },
    servers: [],
    security: [
      {
        bearerAuth: [],
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
        },
      },
    },
  },
  transform: jsonSchemaTransform,
});

app.register(fastifySwaggerUI, {
  routePrefix: "/docs",
});
app.register(authMiddleware);

// Register routes
app.register(authRoutes, { prefix: "/auth" });
app.register(activityRoutes, { prefix: "/activities" });

app.get("/", async function handler() {
  return "Tick Tick Track your activity without fuss";
});

app.get("/health", async function handler() {
  return { message: "App is Strong and healthy 🚀" };
});

app.listen({ port: parseInt(process.env.PORT || "3000") }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
