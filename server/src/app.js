import express from "express";
import cors from "cors";
import { clerkMiddleware, getAuth } from "@clerk/express";
import authRoutes from "./routes/auth.route.js";
import mediaRoutes from "./routes/media.route.js";
import projectRoutes from "./routes/project.route.js";
import { fileURLToPath } from "node:url";

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

const hasClerkKeys = Boolean(
  process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY,
);
if (hasClerkKeys) app.use(clerkMiddleware());

const requireClerkUser = (req, res, next) => {
  if (!hasClerkKeys) {
    return res.status(503).json({
      error:
        "Set CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in server/.env to enable authenticated APIs.",
    });
  }
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Sign in to continue." });
  req.clerkUserId = userId;
  return next();
};

app.use("/api/users", requireClerkUser, authRoutes);
app.use(
  "/uploads",
  express.static(fileURLToPath(new URL("../uploads/", import.meta.url))),
);
app.use(
  "/exports",
  express.static(fileURLToPath(new URL("../exports/", import.meta.url))),
);
app.use("/api/media", requireClerkUser, mediaRoutes);
app.use("/api/projects", requireClerkUser, projectRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    message: "Welcome Aurora Studio",
    status: "Running",
  });
});

app.use((error, _req, res, _next) => {
  console.error("API error:", error);
  const status = error.status || (error.name === "MulterError" ? 400 : 500);
  res.status(status).json({
    error:
      error.publicMessage ||
      (status < 500 ? error.message : "The request could not be completed."),
  });
});

export { app };
