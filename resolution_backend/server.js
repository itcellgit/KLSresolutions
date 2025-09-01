const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3000;

// Add this line before your routes!
app.use(express.json());
app.use(cors());

const userRoutes = require("./routes/users");
const instituteRoutes = require("./routes/institute");
const gcResolutionRoutes = require("./routes/gc_resolutions");
const bomResolutionRoutes = require("./routes/bom_resolutions");

app.use("/api/user", userRoutes);
app.use("/api/institute", instituteRoutes);
app.use("/api/gc_resolutions", gcResolutionRoutes);
app.use("/api/bom_resolutions", bomResolutionRoutes);
app.use("/api/members", require("./routes/members"));

app.get("/", (req, res) => {
  res.send("Hello from your Express backend!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
