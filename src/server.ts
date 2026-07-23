import { startTelemetry, shutdownTelemetry } from "./telemetry.js";
import { createApp } from "./app.js";

const PORT = Number(process.env.PORT) || 3000;

startTelemetry();

const app = createApp();

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

const shutdown = async () => {
  await shutdownTelemetry();
  process.exit(0);
};

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});
