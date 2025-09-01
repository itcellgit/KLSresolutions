const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3000;
const userRoutes = require("./routes/users");
app.use(cors());
app.use(express.json());
app.use("/api/user", userRoutes);
app.get("/", (req, res) => {
  res.send("Hello from your Express backend!");
});
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
