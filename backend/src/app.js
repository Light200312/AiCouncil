
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import authRoutes from "./modules/auth/auth.routes.js";
import {
  notFound,
  errorHandler,
} from "./middleware/error.middleware.js";
import { protect } from "./middleware/auth.middleware.js";
const app = express();
/*CORS: Decides which origins browsers are allowed to access my backend from.
Helmet: Secures my Express application by configuring HTTP security headers.
Cookie Parser: Parses cookies from incoming HTTP requests so I can access them using req.cookies */
// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.CLIENT_URLS,
    credentials: true,//allows the browser to send and receive cookies
  })
);

// Request parsers
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// Health check
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Council API is running",
  });
});

app.get("/api/v1/protected", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Cookie is sent automatically by the browser if it exists and is valid",
  });
});
// Routes
app.use("/api/v1/auth", authRoutes);

// Error handling (must be after routes)
app.use(notFound);
app.use(errorHandler);

export default app;
