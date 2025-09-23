const { MemberRole, Member, Role, Institute } = require("../models");

// Get all member roles (optionally filter by member_id, role_id, or institute_id)
exports.getAllMemberRoles = async (req, res) => {
  console.log("Fetching all member roles with query:", req.query);
  try {
    const { member_id, role_id, institute_id } = req.query;
    const where = {};
    if (member_id) where.member_id = member_id;
    if (role_id) where.role_id = role_id;
    if (institute_id) where.institute_id = institute_id;

    const memberRoles = await MemberRole.findAll({
      where,
      order: [["id", "DESC"]],
    });
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

    console.log("Received request to create MemberRole with data:", req.body);

    // Validate required fields
    if (!member_id || !role_id || !level || !tenure || !status) {
      console.log("Validation failed: Missing required fields");
      return res.status(400).json({
        error: "member_id, role_id, level, tenure, and status are required",
      });
    }

    // Validate data types
    if (isNaN(parseInt(member_id)) || isNaN(parseInt(role_id))) {
      console.log(
        "Validation failed: member_id and role_id must be valid integers"
      );
      return res.status(400).json({
        error: "member_id and role_id must be valid integers",
      });
    }

    // institute_id is optional (BOM roles are not related to any institute)
    if (
      institute_id &&
      institute_id !== null &&
      institute_id !== "" &&
      isNaN(parseInt(institute_id))
    ) {
      console.log(
        "Validation failed: institute_id must be a valid integer when provided"
      );
      return res.status(400).json({
        error: "institute_id must be a valid integer when provided",
      });
    }

    // Validate field lengths
    if (level.length > 5) {
      console.log("Validation failed: level exceeds maximum length");
      return res.status(400).json({
        error: "level must be 5 characters or less",
      });
    }

    if (tenure.length > 128) {
      console.log("Validation failed: tenure exceeds maximum length");
      return res.status(400).json({
        error: "tenure must be 128 characters or less",
      });
    }

    if (status.length > 20) {
      console.log("Validation failed: status exceeds maximum length");
      return res.status(400).json({
        error: "status must be 20 characters or less",
      });
    }

    console.log("Creating MemberRole with data:", req.body);

    // Validate that referenced entities exist
    const member = await Member.findByPk(member_id);
    if (!member) {
      console.log(`Member with ID ${member_id} not found`);
      return res
        .status(404)
        .json({ error: `Member with ID ${member_id} not found` });
    }

    const role = await Role.findByPk(role_id);
    if (!role) {
      console.log(`Role with ID ${role_id} not found`);
      return res
        .status(404)
        .json({ error: `Role with ID ${role_id} not found` });
    }

    // Only validate institute if institute_id is provided (BOM roles don't need institute)
    if (institute_id && institute_id !== null && institute_id !== "") {
      const institute = await Institute.findByPk(institute_id);
      if (!institute) {
        console.log(`Institute with ID ${institute_id} not found`);
        return res
          .status(404)
          .json({ error: `Institute with ID ${institute_id} not found` });
      }
    }

    console.log("All referenced entities validated successfully");

    // Check for existing role assignment for the same member, role, institute, and tenure
    // This prevents duplicate assignments for the same institute but allows different institutes
    const existingRole = await MemberRole.findOne({
      where: {
        member_id: member_id,
        role_id: role_id,
        institute_id: institute_id || null, // Handle null institute_id for BOM roles
        tenure: tenure,
        status: "active",
      },
    });

    if (existingRole) {
      console.log(
        `Member ${member_id} already has an active role ${role_id} for institute ${
          institute_id || "BOM"
        } and tenure ${tenure}`
      );
      return res.status(400).json({
        error: `Member already has this active role for the same institute and tenure`,
        details: `Cannot assign the same role to a member for the same institute and tenure period`,
      });
    }

    // Check for previous active member roles for the given member_id with different tenure
    const activeMemberRoles = await MemberRole.findAll({
      where: {
        member_id: member_id,
        status: "active",
        tenure: {
          [require("sequelize").Op.ne]: tenure, // Only get roles with different tenure
        },
      },
    });

    console.log(
      `Found ${activeMemberRoles.length} active roles with different tenure for member_id: ${member_id}`
    );

    //Make previous active roles with different tenure inactive
    if (activeMemberRoles.length > 0) {
      const updateResult = await MemberRole.update(
        { status: "inactive" },
        {
          where: {
            member_id: member_id,
            status: "active",
            tenure: {
              [require("sequelize").Op.ne]: tenure, // Only update roles with different tenure
            },
          },
        }
      );
      console.log(
        `Made ${activeMemberRoles.length} previous roles with different tenure inactive for member_id: ${member_id}. Updated rows: ${updateResult[0]}`
      );
    }

    // Create the new member role
    const newMemberRole = await MemberRole.create({
      member_id: parseInt(member_id),
      role_id: parseInt(role_id),
      institute_id:
        institute_id && institute_id !== null && institute_id !== ""
          ? parseInt(institute_id)
          : null,
      level: level.toString(),
      tenure: tenure.toString(),
      status: status.toString(),
    });

    console.log(
      "Successfully created new member role with ID:",
      newMemberRole.id
    );
    res.status(201).json(newMemberRole);
  } catch (err) {
    console.error("Error creating member role:", err);

    // Handle specific Sequelize validation errors
    if (err.name === "SequelizeValidationError") {
      const validationErrors = err.errors.map((error) => ({
        field: error.path,
        message: error.message,
        value: error.value,
      }));
      console.log("Sequelize validation errors:", validationErrors);
      return res.status(400).json({
        error: "Validation error",
        details: validationErrors,
      });
    }

    // Handle foreign key constraint errors
    if (err.name === "SequelizeForeignKeyConstraintError") {
      console.log("Foreign key constraint error:", err.message);
      return res.status(400).json({
        error: "Foreign key constraint error",
        details: err.message,
      });
    }

    // Handle unique constraint errors
    if (err.name === "SequelizeUniqueConstraintError") {
      console.log("Unique constraint error:", err.message);
      return res.status(400).json({
        error: "Unique constraint violation",
        details: err.message,
      });
    }

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
