const { User, UserType } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET || "klsbelagavibom"; // Use env variable in production

exports.register = async (req, res) => {
  try {
    const { username, password, usertypeid } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
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

const bcrypt = require("bcrypt");
const { query } = require("../db"); // your DB query function, adjust import as needed

exports.validateUser = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    const { rows } = await query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "User  not found" });
    }
    const user = rows[0];

    const passwordMatch = await bcrypt.compare(password, user.pwd);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    let userDetails = { ...user };

    if (user.usertypeid == 2) {
      const { rows: instituterow } = await query(
        "SELECT * FROM users_institute WHERE userid = $1",
        [user.id]
      );
      if (instituterow.length === 0) {
        return res.status(404).json({ error: "Institute not found" });
      }
      userDetails.institute = instituterow[0];
    } else if (user.usertypeid == 3) {
      const { rows: membersrow } = await query(
        "SELECT * FROM members WHERE userid = $1",
        [user.id]
      );
      if (membersrow.length === 0) {
        return res.status(404).json({ error: "Member not found" });
      } else {
        userDetails.member = membersrow[0];
        const { rows: memberrolerow } = await query(
          "SELECT * FROM members_role WHERE memberid = $1",
          [membersrow[0].id]
        );
        if (memberrolerow.length === 0) {
          return res.status(404).json({ error: "Member role not found" });
        } else {
          userDetails.memberrole = memberrolerow[0];
        }
      }
    }

    res.status(200).json({ message: "Login successful", user: userDetails });
  } catch (err) {
    console.error("Detailed Error: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ include: UserType });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
