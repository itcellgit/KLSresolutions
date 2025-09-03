const { Member, User } = require("../models");

// Get all members (admin sees all, institute admin sees only their members)
exports.getAllMembers = async (req, res) => {
  try {
    let members;
    if (req.user.usertypeid === 1) { // admin
      members = await Member.findAll({ include: User });
    } else if (req.user.usertypeid === 2) { // institute admin
      members = await Member.findAll({
        include: [{ model: User, where: { institute_id: req.user.institute_id } }]
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
    const bcrypt = require("bcrypt");
    const { name, phone, address, username, password, usertypeid, institute_id } = req.body;

    // Validate required fields
    if (!name || !phone || !username || !password || !usertypeid) {
      return res.status(400).json({ error: "Missing required fields (name, phone, username, password, usertypeid)" });
    }

    // Only main admin can create members
    const { role_id, level, tenure, status } = req.body;
    if (req.user.usertypeid !== 1) {
      return res.status(403).json({ error: "Only main admin can create members" });
    }
    // Main admin creating member (must provide institute_id)
    if (!institute_id) {
      return res.status(400).json({ error: "Admin must provide institute_id to create institute member" });
    }
    if (usertypeid !== 3) {
      return res.status(400).json({ error: "Admin can only create institute members (usertypeid: 3) with institute_id" });
    }
    if (!role_id || !tenure || !status) {
      return res.status(400).json({ error: "role_id, tenure, and status are required" });
    }
    const bcrypt = require("bcrypt");
    // Check if user already exists
    let user = await User.findOne({ where: { username } });
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({ username, password: hashedPassword, usertypeid, institute_id });
    }
    // Create member for this user if not exists
    let member = await Member.findOne({ where: { userid: user.id } });
    if (!member) {
      member = await Member.create({ name, phone, address, userid: user.id });
    }
    // Check if member_role already exists for this member, role, and institute
    const MemberRole = require("../models").MemberRole;
    let memberRole = await MemberRole.findOne({
      where: {
        member_id: member.id,
        role_id,
        institute_id
      }
    });
    if (memberRole) {
      // Update existing member_role
      memberRole.level = level || memberRole.level;
      memberRole.tenure = tenure || memberRole.tenure;
      memberRole.status = status || memberRole.status;
      await memberRole.save();
      return res.status(200).json({ user, member, memberRole, message: "Role updated for existing member" });
    } else {
      // Create new member_role entry
      memberRole = await MemberRole.create({
        member_id: member.id,
        role_id,
        institute_id,
        level: level || '',
        tenure,
        status
      });
      return res.status(201).json({ user, member, memberRole, message: "New role added for member" });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
