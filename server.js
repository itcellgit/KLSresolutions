const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3000;

// Middleware to log every API call
app.use((req, res, next) => {
  console.log(`[API CALL] ${req.method} ${req.originalUrl}`);
  next();
});

// Add this line before your routes!
// Increase JSON payload limit to handle large requests (50MB)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(
  cors({
    // Allow any origin for development; restrict in production if needed
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
    credentials: true,
  })
);

// Ensure preflight requests are handled and return appropriate headers
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.header("Origin") || "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    req.header("Access-Control-Request-Headers") ||
      "Content-Type, Authorization"
  );
  res.header("Access-Control-Expose-Headers", "Authorization");
  // Let the browser know how long to cache the preflight response
  res.header("Access-Control-Max-Age", "86400");
  // Vary header for proxies
  res.header("Vary", "Origin");
  return res.sendStatus(204);
});

const userRoutes = require("./routes/users");
const instituteRoutes = require("./routes/institute");
const gcResolutionRoutes = require("./routes/gc_resolutions");
const bomResolutionRoutes = require("./routes/bom_resolutions");
const roleRoutes = require("./routes/roles");
const agmRoutes = require("./routes/agm");
const memberRoleRoutes = require("./routes/memberrole");
const statisticsRoutes = require("./routes/statistics");
const managementTenureRoutes = require("./routes/managementTenures");

app.use("/api/user", userRoutes);
app.use("/api/institute", instituteRoutes);
app.use("/api/gc_resolutions", gcResolutionRoutes);
app.use("/api/bom_resolutions", bomResolutionRoutes);
app.use("/api/members", require("./routes/members"));
app.use("/api/roles", roleRoutes);
app.use("/api/agm", agmRoutes); // Add this line
app.use("/api/memberrole", memberRoleRoutes);
app.use("/api/management_tenures", managementTenureRoutes);

// Statistics API
app.use("/api/statistics", statisticsRoutes);

// Error logging middleware (should be after all routes)
app.use((err, req, res, next) => {
  console.error(`[API ERROR] ${req.method} ${req.originalUrl}:`, err);

  // Handle specific error types
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      error: "Request entity too large. Maximum file size is 50MB.",
      code: "PAYLOAD_TOO_LARGE",
    });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      error: "File too large. Maximum file size is 50MB.",
      code: "FILE_TOO_LARGE",
    });
  }

  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal Server Error" });
});

app.get("/", (req, res) => {
  res.send("Hello from your Express backend!");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
  console.log(`Also accessible at http://localhost:${PORT}`);
  console.log(`And at http://10.22.0.152:${PORT} (for mobile/external access)`);
});

module.exports = app;
