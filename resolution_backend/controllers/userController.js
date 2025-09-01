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

//adding institute and create the user for institute admin

exports.addInstituteWithUser = async (req, res) => {
  const { name, code, phone, email } = req.body;

  if (!name || !code || !phone || !email) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const defaultPassword = "defaultPassword123"; // choose your default password
  try {
    // Hash the default password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // Start a transaction
    await pool.query("BEGIN");

    // Insert into institute table
    const instituteInsertQuery = `
      INSERT INTO institute (name, code, phone)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    const instituteResult = await pool.query(instituteInsertQuery, [
      name,
      code,
      phone,
    ]);
    const instituteId = instituteResult.rows[0].id;

    // Insert into users table
    const userInsertQuery = `
      INSERT INTO users (email, pwd, usertypeid, instituteid)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, usertypeid
    `;
    const userResult = await pool.query(userInsertQuery, [
      email,
      hashedPassword,
      2,
      instituteId,
    ]);

    // Commit transaction
    await pool.query("COMMIT");

    res.status(201).json({
      message: "Institute and user created successfully",
      instituteId,
      user: userResult.rows[0],
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error inserting institute and user:", error);
    res.status(500).json({ error: "Failed to create institute and user" });
  }
};
