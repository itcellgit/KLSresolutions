const express = require("express");
const bcrypt = require("bcrypt"); // Import the bcrypt library
const { query } = require("./db"); // Import the query function from db.js
const cors = require("cors"); // Import cors
const app = express();

const { Pool } = require("pg");

const PORT = 3000;

// Enable CORS for all routes (important for development)
app.use(cors());
app.use(express.json()); // Parse JSON bodies
// Setup DB connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "resolutions",
  password: "password",
  port: 5432, // default postgres port
});

app.get("/", (req, res) => {
  res.send("Hello from your Express backend!");
});

// Mount routes with prefixes
app.use("/api/users", require("./routes/users"));
app.use("/api/members", require("./routes/members"));

// Route eg localhost:portno/api/users/router-enpoint

app.get("/api/users", async (req, res) => {
  try {
    const { rows } = await query("SELECT * FROM users");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// // Middleware
// app.use(cors()); // Enable CORS for all routes
// app.use(express.json()); // Parse JSON bodies

// // Routes
// app.use("/api", authRoutes);

// //insertion
// app.get("/submit", async (req, res) => {
//   try {
//     // Hardcoded values

//     const username = "principaloffice@git.edu";
//     const password = "password123";
//     const usertype = 2;

//     // --- SECURITY STEP: HASH THE PASSWORD ---
//     // Generate a salt with a cost factor (10 is a common value)
//     const salt = await bcrypt.genSalt(10);
//     // Hash the password with the salt
//     const hashedPassword = await bcrypt.hash(password, salt);
//     const result = await pool.query(
//       "INSERT INTO public.users (username, pwd, usertypeid) VALUES ($1, $2, $3) RETURNING *",
//       [username, hashedPassword, usertype]
//     );
//     res
//       .status(201)
//       .json({ message: "User created successfully", user: result.rows[0] });
//   } catch (err) {
//     console.error("Detailed Error: ", JSON.stringify(err, null, 2));
//     res.status(500).json({ error: "Database insert failed" });
//   }
// });

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// app.post("/api/user/validate", async (req, res) => {
//   const { username, password } = req.body;
//   // Validate input
//   if (!username || !password) {
//     return res
//       .status(400)
//       .json({ error: "Username and password are required" });
//   }

//   try {
//     const { rows } = await query("SELECT * FROM users WHERE username = $1 ", [
//       username,
//     ]);
//     if (rows.length === 0) {
//       return res.status(404).json({ error: "User not found" });
//     }
//     const user = rows[0];

//     // Compare password with stored hash
//     const passwordMatch = await bcrypt.compare(password, user.pwd);
//     console.log("Password match result: ", passwordMatch);
//     if (!passwordMatch) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }
//     let userDetails = { ...user }; // Copy basic user data
//     if (user.usertypeid == 2) {
//       const { instituterow } = await query(
//         "SELECT * FROM users_institute WHERE userid = $1",
//         [user.id]
//       );
//       if (instituterow.length === 0) {
//         return res.status(404).json({ error: "Institute not found" });
//       }
//       userDetails.institute = instituterow[0];
//     } else if (user.usertypeid == 3) {
//       const { membersrow } = await query(
//         "SELECT * FROM members WHERE userid = $1",
//         [user.id]
//       );
//       if (membersrow.length === 0) {
//         return res.status(404).json({ error: "Member not found" });
//       } else {
//         userDetails.member = membersrow[0];
//         const { memberrolerow } = await query(
//           "SELECT * FROM members_role WHERE memberid = $1",
//           [membersrow[0].id]
//         );
//         if (memberrolerow.length === 0) {
//           return res.status(404).json({ error: "Member role not found" });
//         } else {
//           userDetails.memberrole = memberrolerow[0];
//         }
//       }
//     }
//     res.status(200).json({ message: "Login successful", user: userDetails });
//   } catch (err) {
//     console.error("Detailed Error: ", JSON.stringify(err, null, 2));
//     res.status(500).json({ error: "Internal server error" });
//   }
// });
