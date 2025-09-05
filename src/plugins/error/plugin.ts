import { FastifyPluginAsync, FastifyError } from "fastify";
import fp from "fastify-plugin";
import { Prisma } from "@prisma/client";

// Custom error classes
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 400, code);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Access denied") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource conflict") {
    super(message, 409, "CONFLICT");
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    statusCode: number;
    timestamp: string;
    path?: string;
    method?: string;
    details?: unknown;
  };
}

// Prisma error mapping
const mapPrismaError = (
  error: Prisma.PrismaClientKnownRequestError
): AppError => {
  switch (error.code) {
    case "P2002":
      return new ConflictError("A record with this information already exists");
    case "P2025":
      return new NotFoundError("Record not found");
    case "P2003":
      return new ValidationError("Foreign key constraint failed");
    case "P2014":
      return new ValidationError(
        "The change you are trying to make would violate the required relation"
      );
    case "P2001":
      return new NotFoundError("Record not found");
    case "P2011":
      return new ValidationError("Null constraint violation");
    case "P2012":
      return new ValidationError("Missing required value");
    case "P2016":
      return new ValidationError("Query interpretation error");
    case "P2017":
      return new ValidationError("The records for relation are not connected");
    case "P2018":
      return new ValidationError(
        "The required connected records were not found"
      );
    case "P2019":
      return new ValidationError("Input error");
    case "P2020":
      return new ValidationError("Value out of range for the type");
    case "P2021":
      return new NotFoundError(
        "The table does not exist in the current database"
      );
    case "P2022":
      return new ValidationError(
        "The column does not exist in the current database"
      );
    case "P2023":
      return new ValidationError("Inconsistent column data");
    case "P2024":
      return new ValidationError(
        "Timed out fetching a new connection from the connection pool"
      );
    default:
      return new AppError("Database operation failed", 500, "DATABASE_ERROR");
  }
};

// Zod validation error mapping
interface ZodError {
  issues: Array<{
    path: (string | number)[];
    message: string;
  }>;
}

const mapZodError = (error: ZodError): ValidationError => {
  const issues = error.issues || [];
  const errors: Record<string, string> = {};
  issues.forEach((issue) => {
    const path = issue.path.join(".");
    errors[path] = issue.message;
  });

  return new ValidationError(JSON.stringify(errors), "VALIDATION_ERROR");
};

// Fastify validation error mapping
const mapFastifyValidationError = (error: FastifyError): ValidationError => {
  const errors: Record<string, string> = {};
  error.validation?.forEach((v) => {
    errors[v.instancePath] = v.message || "";
  });
  return new ValidationError(JSON.stringify(errors), "VALIDATION_ERROR");
};

// Error formatter
const formatError = (
  error: Error,
  request?: { url?: string; method?: string }
): ErrorResponse => {
  const timestamp = new Date().toISOString();

  // Handle custom AppError
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        timestamp,
        path: request?.url,
        method: request?.method,
      },
    };
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const mappedError = mapPrismaError(error);
    return {
      success: false,
      error: {
        message: mappedError.message,
        code: mappedError.code,
        statusCode: mappedError.statusCode,
        timestamp,
        path: request?.url,
        method: request?.method,
        details:
          process.env.NODE_ENV === "development" ? error.meta : undefined,
      },
    };
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      success: false,
      error: {
        message: "Invalid data provided",
        code: "VALIDATION_ERROR",
        statusCode: 400,
        timestamp,
        path: request?.url,
        method: request?.method,
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
    };
  }

  // Handle Zod validation errors
  if (error.name === "ZodError") {
    const mappedError = mapZodError(error as unknown as ZodError);
    return {
      success: false,
      error: {
        message: mappedError.message,
        code: mappedError.code,
        statusCode: mappedError.statusCode,
        timestamp,
        path: request?.url,
        method: request?.method,
      },
    };
  }

  // Handle Fastify validation errors
  if ("validation" in error && error.validation) {
    const mappedError = mapFastifyValidationError(error as FastifyError);
    return {
      success: false,
      error: {
        message: mappedError.message,
        code: mappedError.code,
        statusCode: mappedError.statusCode,
        timestamp,
        path: request?.url,
        method: request?.method,
      },
    };
  }

  // Handle JWT errors
  if (error.name === "JsonWebTokenError") {
    return {
      success: false,
      error: {
        message: "Invalid token",
        code: "INVALID_TOKEN",
        statusCode: 401,
        timestamp,
        path: request?.url,
        method: request?.method,
      },
    };
  }

  if (error.name === "TokenExpiredError") {
    return {
      success: false,
      error: {
        message: "Token has expired",
        code: "TOKEN_EXPIRED",
        statusCode: 401,
        timestamp,
        path: request?.url,
        method: request?.method,
      },
    };
  }

  // Handle generic errors
  const statusCode = (error as FastifyError).statusCode || 500;
  const isOperational = error instanceof AppError ? error.isOperational : false;

  return {
    success: false,
    error: {
      message: isOperational ? error.message : "Internal server error",
      code: "INTERNAL_ERROR",
      statusCode,
      timestamp,
      path: request?.url,
      method: request?.method,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    },
  };
};

// Error logging
interface RequestInfo {
  method?: string;
  url?: string;
  headers?: Record<string, unknown>;
  body?: unknown;
  query?: unknown;
  params?: unknown;
}

const logError = (
  error: Error,
  request?: RequestInfo,
  formattedError?: ErrorResponse
) => {
  const logData = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(formattedError && { formatted: formattedError }),
    },
    request: request
      ? {
          method: request.method,
          url: request.url,
          headers: request.headers,
          body: request.body,
          query: request.query,
          params: request.params,
        }
      : undefined,
    timestamp: new Date().toISOString(),
  };

  // Log error based on severity
  if (error instanceof AppError && error.statusCode < 500) {
    console.warn("Client Error:", JSON.stringify(logData, null, 2));
  } else {
    console.error("Server Error:", JSON.stringify(logData, null, 2));
  }
};

// Main error handling plugin
const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  // Set error handler
  fastify.setErrorHandler(async (error, request, reply) => {
    // Format the error
    const formattedError = formatError(error, request);

    // Log the error
    logError(error, request, formattedError);
    const { statusCode, message } = formattedError.error;
    // Send the formatted error response
    await reply
      .status(statusCode)
      .send({ success: false, error: { message, statusCode } });
  });

  // Set not found handler
  fastify.setNotFoundHandler(async (request, reply) => {
    const error = new NotFoundError(
      `Route ${request.method} ${request.url} not found`
    );
    const formattedError = formatError(error, request);

    logError(error, request, formattedError);
    const { message } = formattedError.error;

    await reply.status(404).send({ message });
  });

  // Add error classes to fastify instance for use in routes
  fastify.decorate("AppError", AppError);
  fastify.decorate("ValidationError", ValidationError);
  fastify.decorate("AuthenticationError", AuthenticationError);
  fastify.decorate("AuthorizationError", AuthorizationError);
  fastify.decorate("NotFoundError", NotFoundError);
  fastify.decorate("ConflictError", ConflictError);
};

// Extend FastifyInstance type to include error classes
declare module "fastify" {
  interface FastifyInstance {
    AppError: typeof AppError;
    ValidationError: typeof ValidationError;
    AuthenticationError: typeof AuthenticationError;
    AuthorizationError: typeof AuthorizationError;
    NotFoundError: typeof NotFoundError;
    ConflictError: typeof ConflictError;
  }
}

export default fp(errorHandlerPlugin, {
  name: "error-handler",
});
