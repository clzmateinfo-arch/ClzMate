const os = require("os");
const express = require("express");
const helmet = require("helmet");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const { sanitizeRequest } = require("./middleware/sanitize");
const { globalLimiter } = require("./middleware/rateLimit");
const { uploadGuard } = require("./middleware/uploadGuard");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandlers");

const userRoutes = require("./routes/user");
const profileRoutes = require("./routes/profile");
const paymentRoutes = require("./routes/payments");
const courseRoutes = require("./routes/course");
const adminRoutes = require("./routes/admin");
const cartRoutes = require("./routes/cart");
const studentRoutes = require("./routes/student");
const statsRoutes = require("./routes/stats");
const classroomRoutes = require("./routes/classroom");
const contactRoutes = require("./routes/contact");
const snapshotRoutes = require("./routes/snapshot");
const { republishOnContentMutation } = require("./utils/snapshotPublisher");

const MAX_UPLOAD_BYTES = (Number(process.env.MAX_UPLOAD_MB) || 200) * 1024 * 1024;

function buildCorsPolicy() {
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const blockNoOrigin = (process.env.CORS_BLOCK_NO_ORIGIN || "false").toLowerCase() === "true";

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, !blockNoOrigin);
      return callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
    optionsSuccessStatus: 200,
  };

  const rejectDisallowedOrigin = (req, res, next) => {
    const origin = req.headers.origin;
    if (!origin || allowedOrigins.includes(origin)) return next();
    return res.status(403).json({ success: false, message: "CORS origin not allowed" });
  };

  return { corsOptions, rejectDisallowedOrigin };
}

function createApp() {
  const app = express();
  const { corsOptions, rejectDisallowedOrigin } = buildCorsPolicy();

  if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(rejectDisallowedOrigin);
  app.use(globalLimiter);
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(
    fileUpload({
      useTempFiles: true,
      tempFileDir: os.tmpdir(),
      limits: { fileSize: MAX_UPLOAD_BYTES },
      abortOnLimit: true,
    })
  );
  app.use(uploadGuard);
  app.use(sanitizeRequest);

  app.use("/api/v1", republishOnContentMutation());
  app.use("/api/v1", snapshotRoutes);
  app.use("/api/v1/auth", userRoutes);
  app.use("/api/v1/profile", profileRoutes);
  app.use("/api/v1/payment", paymentRoutes);
  app.use("/api/v1/course", courseRoutes);
  app.use("/api/v1/admin", adminRoutes);
  app.use("/api/v1/cart", cartRoutes);
  app.use("/api/v1/student", studentRoutes);
  app.use("/api/v1/site", statsRoutes);
  app.use("/api/v1/classroom", classroomRoutes);
  app.use("/api/v1/reach", contactRoutes);

  app.get("/", (req, res) => res.json({ success: true, message: "ClzMate API" }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
