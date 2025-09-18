const { MemberRole } = require("../models");

// Get all member roles (optionally filter by member_id, role_id, or institute_id)
exports.getAllMemberRoles = async (req, res) => {
  console.log("Fetching all member roles with query:", req.query);
  try {
    const { member_id, role_id, institute_id } = req.query;
    const where = {};
    if (member_id) where.member_id = member_id;
    if (role_id) where.role_id = role_id;
    if (institute_id) where.institute_id = institute_id;

    const memberRoles = await MemberRole.findAll({ where });
    res.json(memberRoles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single member role by id
exports.getMemberRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const memberRole = await MemberRole.findByPk(id);
    if (!memberRole) {
      return res.status(404).json({ error: "Member role not found" });
    }
    res.json(memberRole);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new member role
exports.createMemberRole = async (req, res) => {
  try {
    const { member_id, role_id, institute_id, level, tenure, status } =
      req.body;

    if (!member_id || !role_id || !tenure || !status) {
      return res.status(400).json({
        error: "member_id, role_id, tenure, and status are required",
      });
    }
    console.log("Creating MemberRole with data:", req.body);
    const newMemberRole = await MemberRole.create({
      member_id,
      role_id,
      institute_id,
      level: level,
      tenure,
      status,
    });

    res.status(201).json(newMemberRole);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update a member role by id
exports.updateMemberRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { member_id, role_id, institute_id, level, tenure, status } =
      req.body;

    const memberRole = await MemberRole.findByPk(id);
    if (!memberRole) {
      return res.status(404).json({ error: "Member role not found" });
    }

    await memberRole.update({
      member_id: member_id || memberRole.member_id,
      role_id: role_id || memberRole.role_id,
      institute_id: institute_id || memberRole.institute_id,
      level: level || memberRole.level,
      tenure: tenure || memberRole.tenure,
      status: status || memberRole.status,
    });

    res.json(memberRole);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a member role by id
exports.deleteMemberRole = async (req, res) => {
  try {
    const { id } = req.params;
    const memberRole = await MemberRole.findByPk(id);
    if (!memberRole) {
      return res.status(404).json({ error: "Member role not found" });
    }

    await memberRole.destroy();
    res.json({ message: "Member role deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
