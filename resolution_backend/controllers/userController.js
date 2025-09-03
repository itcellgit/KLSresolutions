const { User, UserType, members, member_role } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../service/emailService");
const otpStore = {};
// Forgot password (send OTP)
exports.forgotPassword = async (req, res) => {
  const { username: fpUsername } = req.body;
  if (!fpUsername) return res.status(400).json({ error: "Username required" });
  const fpUser = await User.findOne({ where: { username: fpUsername } });
  if (!fpUser) return res.status(404).json({ error: "User not found" });
  // Generate OTP
  const fpOtp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[fpUsername] = fpOtp;
  try {
    await sendOtpEmail(fpUsername, fpOtp);
    res.json({ message: "OTP sent to email" });
  } catch (err) {
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

// Reset password (with OTP)
exports.resetPassword = async (req, res) => {
  const { username: rpUsername, otp: rpOtp, newPassword } = req.body;
  if (!rpUsername || !rpOtp || !newPassword) return res.status(400).json({ error: "All fields required" });
  if (otpStore[rpUsername] !== rpOtp) return res.status(400).json({ error: "Invalid OTP" });
  const rpUser = await User.findOne({ where: { username: rpUsername } });
  if (!rpUser) return res.status(404).json({ error: "User not found" });
  rpUser.password = await bcrypt.hash(newPassword, 10);
  await rpUser.save();
  delete otpStore[rpUsername];
  res.json({ message: "Password reset successful" });
};
const pool = require("../db"); // <-- Corrected import
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

    // Do NOT include id, let PostgreSQL auto-generate it
    const user = await User.create({
      username,
      password: hashedPassword,
      usertypeid,
      // institute_id can be added if needed
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
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Compare password with hashed password stored in DB
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Prepare user details to return
    let userDetails = {
      id: user.id,
      username: user.username,
      usertypeid: user.usertypeid,
      institute_id: user.institute_id,
    };

    // Fetch all member_role associations for this user
    const memberRows = await pool.query("SELECT * FROM members WHERE userid = $1", [user.id]);
    let memberRolesWithInstitute = [];
    if (memberRows.rows.length > 0) {
      const memberId = memberRows.rows[0].id;
      // Get all roles for this member
      const memberRoles = await pool.query(
        `SELECT mr.*, r.role_name, i.name as institute_name, i.id as institute_id
         FROM member_role mr
         JOIN roles r ON mr.role_id = r.id
         LEFT JOIN institutes i ON mr.institute_id = i.id
         WHERE mr.member_id = $1 AND mr.status = 'active'`,
        [memberId]
      );
      memberRolesWithInstitute = memberRoles.rows.map(role => ({
        role_id: role.role_id,
        role_name: role.role_name,
        institute_id: role.institute_id,
        institute_name: role.institute_name,
        level: role.level,
        tenure: role.tenure,
        status: role.status
      }));
    }

    // Generate JWT token
    const token = jwt.sign({
      id: user.id,
      username: user.username,
      usertypeid: user.usertypeid,
      institute_id: user.institute_id,
    }, JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({
      message: "Login successful",
      user: userDetails,
      roles: memberRolesWithInstitute,
      token,
    });
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
  const username = email;
  const defaultPassword = "kls12345"; // choose your default password
  try {
    // Hash the default password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);
    console.log(name, code, phone, username);
    // Start a transaction
    await pool.query("BEGIN");

    // Insert into institute table
    const instituteInsertQuery = `
      INSERT INTO institutes (name, code, phone)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    const instituteResult = await pool.query(instituteInsertQuery, [
      name,
      code,
      phone,
    ]);
    const instituteId = instituteResult.rows[0].id;
    console.log("Inserted institute with ID:", instituteId);
    // Insert into users table
    const userInsertQuery = `
      INSERT INTO users (username, password, usertypeid, institute_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, usertypeid
    `;
    const userResult = await pool.query(userInsertQuery, [
      username,
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
