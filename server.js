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
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// Increase server timeout for large uploads
app.use((req, res, next) => {
  req.setTimeout(0); // No timeout
  res.setTimeout(0); // No timeout
  next();
});

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal Server Error" });
});

app.get("/", (req, res) => {
  res.send("Hello from your Express backend!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
