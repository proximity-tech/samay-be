export const publicRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/logout",
  "/docs",
  "/docs/static/swagger-ui-standalone-preset.js",
  "/docs/static/index.css",
  "/docs/static/swagger-ui.css",
  "/docs/static/swagger-ui-bundle.js",
  "/docs/static/swagger-initializer.js",
  "/docs/static/favicon-32x32.png",
  "/docs/static/favicon-16x16.png",
  "/docs/json",
  "/health",
  "/",
]; // Add more public routes as needed

export const adminRoutes = {
  POST: {
    "/users/invite": true,
  },
  GET: {
    "/users": true,
    "/users/:id": true,
  },
  PUT: {
    "/users/:id": true,
  },
  DELETE: {
    "/users/:id": true,
  },
};
