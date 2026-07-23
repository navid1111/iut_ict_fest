import express, { type Application } from "express";
import { healthRouter } from "./routes/health.js";
import { usersRouter } from "./routes/users.js";
import { authRouter } from "./routes/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { observabilityMiddleware } from "./middleware/observability.js";

export function createApp(): Application {
  const app = express();

  app.use(express.json());
  app.use(observabilityMiddleware);

  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use("/api/users", usersRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
