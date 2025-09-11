const { Member, User } = require("../models");
const bcrypt = require("bcrypt");

// Get all members (admin sees all, institute admin sees only their members)
exports.getAllMembers = async (req, res) => {
  try {
    let members;
    if (req.user.usertypeid === 1) {
      // admin
      members = await Member.findAll({ include: User });
    } else if (req.user.usertypeid === 2) {
      // institute admin
      members = await Member.findAll({
        include: [
          { model: User, where: { institute_id: req.user.institute_id } },
        ],
      });
    } else {
      return res.status(403).json({ error: "Access denied" });
    }
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin can add KLS board members and institute admins
// Institute admin can add institute members
exports.createMember = async (req, res) => {
  try {
    const {
      name: mName,
      phone: mPhone,
      address: mAddress,
      username: mUsername,
      password: mPassword,
    } = req.body;

    // Validate required fields
    if (!mName || !mPhone || !mUsername || !mPassword) {
      return res.status(400).json({
        error: "Missing required fields (name, phone, username, password)",
      });
    }

    // Only main admin can create members
    if (req.user.usertypeid !== 1) {
      return res
        .status(403)
        .json({ error: "Only main admin can create members" });
    }

    // usertypeid is always 3 for members
    const mUsertypeid = 3;

    // Check if user already exists
    let user = await User.findOne({ where: { username: mUsername } });
    if (!user) {
      const hashedPassword = await bcrypt.hash(mPassword, 10);
      user = await User.create({
        username: mUsername,
        password: hashedPassword,
        usertypeid: mUsertypeid,
      });
    }

    // Create member for this user if not exists
    let member = await Member.findOne({ where: { userid: user.id } });
    if (!member) {
      member = await Member.create({
        name: mName,
        phone: mPhone,
        address: mAddress,
        userid: user.id,
      });
    }

    return res.status(201).json({ user, member });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update member
exports.updateMember = async (req, res) => {
  console.log("Update member called");
  try {
    const { id } = req.params;
    const {
      name: mName,
      phone: mPhone,
      address: mAddress,
      username: mUsername,
      password: mPassword,
    } = req.body;

    // Validate required fields
    if (!mName || !mPhone || !mUsername) {
      return res.status(400).json({
        error: "Missing required fields (name, phone, username)",
      });
    }

    // Only main admin can update members
    if (req.user.usertypeid !== 1) {
      return res
        .status(403)
        .json({ error: "Only main admin can update members" });
    }

    // Find member with associated user
    const member = await Member.findByPk(id, { include: User });
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    // Update user details
    const userUpdateData = {
      username: mUsername,
    };

    // Only update password if provided
    if (mPassword && mPassword.trim() !== "") {
      userUpdateData.password = await bcrypt.hash(mPassword, 10);
    }

    // Update user
    await member.user.update(userUpdateData);

    // Update member details
    await member.update({
      name: mName,
      phone: mPhone,
      address: mAddress,
    });

    // Return updated member with user
    const updatedMember = await Member.findByPk(id, { include: User });
    return res.status(200).json(updatedMember);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete member
exports.deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    // Only main admin can delete members
    if (req.user.usertypeid !== 1) {
      return res
        .status(403)
        .json({ error: "Only main admin can delete members" });
    }

    // Find member with associated user
    const member = await Member.findByPk(id, { include: User });
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    // Delete member and user
    await member.destroy();
    await member.user.destroy();

    return res.status(200).json({ message: "Member deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Assign role to a member for an institute
exports.assignRole = async (req, res) => {
  try {
    const { member_id, role_id, institute_id, level, tenure, status } =
      req.body;

    if (!member_id || !role_id || !tenure || !status) {
      return res.status(400).json({
        error:
          "member_id, role_id, institute_id, tenure, and status are required",
      });
    }

    const MemberRole = require("../models").MemberRole;
    let memberRole = await MemberRole.findOne({
      where: { member_id, role_id, institute_id },
    });

    if (memberRole) {
      memberRole.level = level || memberRole.level;
      memberRole.tenure = tenure || memberRole.tenure;
      memberRole.status = status || memberRole.status;
      await memberRole.save();
      return res
        .status(200)
        .json({ memberRole, message: "Role updated for existing member" });
    } else {
      memberRole = await MemberRole.create({
        member_id,
        role_id,
        institute_id,
        level: level || "",
        tenure,
        status,
      });
      return res
        .status(201)
        .json({ memberRole, message: "New role assigned to member" });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
