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
app.use(express.json());
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

app.use("/api/user", userRoutes);
app.use("/api/institute", instituteRoutes);
app.use("/api/gc_resolutions", gcResolutionRoutes);
app.use("/api/bom_resolutions", bomResolutionRoutes);
app.use("/api/members", require("./routes/members"));
app.use("/api/roles", roleRoutes);
app.use("/api/agm", agmRoutes); // Add this line

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
