const { User, UserType, members, member_role } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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
    const user = await User.findOne({
      where: { username },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Compare password with hashed password stored in DB
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    // const token1 = jwt.sign(
    //   { id: user.id, email: user.email, usertypeid: user.usertypeid },
    //   JWT_SECRET, // <-- corrected here
    //   { expiresIn: "1h" }
    // );

    // Prepare user details to return
    let userDetails = {
      id: user.id,
      username: user.username,
      usertypeid: user.usertypeid,
      institute_id: user.institute_id,
    };
    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        usertypeid: user.usertypeid,
        institute_id: user.institute_id,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Institute admin (usertypeid: 2)
    if (user.usertypeid == 2) {
      // Fetch institute info

      const institute = await institute.findOne({
        where: { id: user.institute_id },
      });

      res.status(200).json({
        message: "Login successful",
        user: userDetails,
        institute: institute.rows[0],
        token,
      });
    } else if (user.usertypeid == 3) {
      // Optionally fetch member info
      const { rows: member } = await pool.query(
        "SELECT * FROM members WHERE userid = $1",
        [user.id]
      );
      if (member) {
        // Fetch active member roles

        const { rows: member_roles } = await pool.query(
          "SELECT * FROM member_role WHERE member_id = $1 AND status = 'active'",
          [member.id]
        );

        // For each member_role, add institute details if institute_id is not null
        const memberRolesWithInstitute = [];
        for (const role of member_roles.rows) {
          let roleWithInstitute = { ...role };
          if (role.institute_id) {
            const instituteResult = await pool.query(
              "SELECT * FROM institutes WHERE id = $1",
              [role.institute_id]
            );
            if (instituteResult.rows.length > 0) {
              roleWithInstitute.institute = instituteResult.rows[0];
            }
          }
          memberRolesWithInstitute.push(roleWithInstitute);
        }

        // Add to response
        userDetails.member = member;
        userDetails.member_roles = memberRolesWithInstitute;
        res.status(200).json({
          message: "Login successful",
          user: userDetails,
          memberRolesWithInstitute,
          token,
        });
      }
    }

    res.status(200).json({
      message: "Login successful",
      user: userDetails,
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
