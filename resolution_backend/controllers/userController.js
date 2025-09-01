const { User, UserType } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { query } = require("../db"); // Your DB query function
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "klsbelagavibom"; // Use env variable in production

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, password, usertypeid } = req.body;
    if (!username || !password || !usertypeid) {
      return res
        .status(400)
        .json({ error: "Username, password, and usertypeid are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Assuming User.create is a Sequelize model method
    const user = await User.create({
      username,
      password: hashedPassword,
      usertypeid,
    });

    res.status(201).json({ id: user.id, username: user.username });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Validate user login credentials
exports.validateUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    // Query user by username
    const { rows } = await query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User  not found" });
    }

    const user = rows[0];

    // Compare password with hashed password stored in DB
    const passwordMatch = await bcrypt.compare(password, user.pwd);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Prepare user details to return
    let userDetails = { ...user };

    // Fetch additional info based on user type
    if (user.usertypeid == 2) {
      const { rows: instituteRows } = await query(
        "SELECT * FROM users_institute WHERE userid = $1",
        [user.id]
      );
      if (instituteRows.length === 0) {
        return res.status(404).json({ error: "Institute not found" });
      }
      userDetails.institute = instituteRows[0];
    } else if (user.usertypeid == 3) {
      const { rows: memberRows } = await query(
        "SELECT * FROM members WHERE userid = $1",
        [user.id]
      );
      if (memberRows.length === 0) {
        return res.status(404).json({ error: "Member not found" });
      }
      userDetails.member = memberRows[0];

      const { rows: memberRoleRows } = await query(
        "SELECT * FROM members_role WHERE memberid = $1",
        [memberRows[0].id]
      );
      if (memberRoleRows.length === 0) {
        return res.status(404).json({ error: "Member role not found" });
      }
      userDetails.memberrole = memberRoleRows[0];
    }

    // Optionally, generate a JWT token here if you want to implement authentication tokens
    // const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

    res
      .status(200)
      .json({ message: "Login successful", user: userDetails /*, token */ });
  } catch (err) {
    console.error("Detailed Error: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all users (protected route)
exports.getAllUsers = async (req, res) => {
  try {
    // Assuming User is a Sequelize model and UserType is associated
    const users = await User.findAll({ include: UserType });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
