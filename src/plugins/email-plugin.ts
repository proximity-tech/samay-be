import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { EmailService } from "../services/email";

// Use TypeScript module augmentation to declare the type of server.emailService
declare module "fastify" {
  interface FastifyInstance {
    emailService: EmailService;
  }
}

const emailPlugin: FastifyPluginAsync = fp(async (server) => {
  const apiToken = process.env.POSTMARK_API_TOKEN;
  const defaultFrom = process.env.POSTMARK_FROM_EMAIL || "noreply@example.com";

  if (!apiToken) {
    server.log.warn("POSTMARK_API_TOKEN is not set. Email service will not work properly.");
  }

  const emailService = new EmailService(apiToken || "", defaultFrom);

  // Make EmailService available through the fastify server instance: server.emailService
  server.decorate("emailService", emailService);
});

export default emailPlugin;
