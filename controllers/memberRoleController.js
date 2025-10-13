const {
  MemberRole,
  Member,
  Role,
  Institute,
  ManagementTenure,
} = require("../models");

// Get all member roles (optionally filter by member_id, role_id, or institute_id)
exports.getAllMemberRoles = async (req, res) => {
  console.log("Fetching all member roles with query:", req.query);
  try {
    const { member_id, role_id, institute_id, tenure_id } = req.query;
    const where = {};
    if (member_id) where.member_id = member_id;
    if (role_id) where.role_id = role_id;
    if (institute_id) where.institute_id = institute_id;
    if (tenure_id) where.tenure_id = tenure_id;

    const memberRoles = await MemberRole.findAll({
      where,
      include: [
        {
          model: Member,
        },
        {
          model: Role,
          as: "role",
        },
        {
          model: ManagementTenure,
          as: "managementTenure",
        },
      ],
      order: [["id", "DESC"]],
    });
    res.json(memberRoles);
  } catch (err) {
    console.error("Full error details:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get a single member role by id
exports.getMemberRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const memberRole = await MemberRole.findByPk(id, {
      include: [
        {
          model: Member,
        },
        {
          model: Role,
          as: "role",
        },
      ],
    });
    if (!memberRole) {
      return res.status(404).json({ error: "Member role not found" });
    }
    res.json(memberRole);
  } catch (err) {
    console.error("Full error details:", err);
    res.status(500).json({ error: err.message });
  }
};

// Create a new member role
exports.createMemberRole = async (req, res) => {
  try {
    const { member_id, role_id, institute_id, level, tenure_id, status } =
      req.body;

    console.log("Received request to create MemberRole with data:", req.body);

    // Validate required fields - tenure_id is required
    if (!member_id || !role_id || !level || !status) {
      console.log("Validation failed: Missing required fields");
      return res.status(400).json({
        error: "member_id, role_id, level, and status are required",
      });
    }

    if (!tenure_id) {
      console.log("Validation failed:  tenure_id must be provided");
      return res.status(400).json({
        error: "tenure_id must be provided",
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

    // tenure_id is optional but must be valid integer when provided
    if (
      tenure_id &&
      tenure_id !== null &&
      tenure_id !== "" &&
      isNaN(parseInt(tenure_id))
    ) {
      console.log(
        "Validation failed: tenure_id must be a valid integer when provided"
      );
      return res.status(400).json({
        error: "tenure_id must be a valid integer when provided",
      });
    }

    // Validate field lengths
    if (level.length > 5) {
      console.log("Validation failed: level exceeds maximum length");
      return res.status(400).json({
        error: "level must be 5 characters or less",
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

    // Only validate tenure if tenure_id is provided
    if (tenure_id && tenure_id !== null && tenure_id !== "") {
      const managementTenure = await ManagementTenure.findByPk(tenure_id);
      if (!managementTenure) {
        console.log(`Management Tenure with ID ${tenure_id} not found`);
        return res
          .status(404)
          .json({ error: `Management Tenure with ID ${tenure_id} not found` });
      }
    }

    console.log("All referenced entities validated successfully");

    // Check for existing role assignment for the same member, role, institute, and tenure
    // This prevents duplicate assignments for the same institute but allows different institutes
    const whereCondition = {
      member_id: member_id,
      role_id: role_id,
      institute_id: institute_id || null, // Handle null institute_id for BOM roles
      status: "active",
    };

    // Add tenure condition based on what's provided
    if (tenure_id) {
      whereCondition.tenure_id = tenure_id;
    }
    // else if (tenure) {
    //   whereCondition.tenure = tenure;
    // }

    const existingRole = await MemberRole.findOne({
      where: whereCondition,
    });

    if (existingRole) {
      console.log(
        `Member ${member_id} already has an active role ${role_id} for institute ${
          institute_id || "BOM"
        } and tenure_id ${tenure_id}`
      );
      return res.status(400).json({
        error: `Member already has this active role for the same institute and tenure`,
        details: `Cannot assign the same role to a member for the same institute and tenure period`,
      });
    }

    // Check for previous active member roles for the given member_id with different tenure
    const whereConditionForActiveMemberRoles = {
      member_id: member_id,
      status: "active",
    };

    // Only add tenure_id condition if tenure_id is provided and not null
    if (tenure_id && tenure_id !== null && tenure_id !== "") {
      whereConditionForActiveMemberRoles.tenure_id = {
        [require("sequelize").Op.ne]: tenure_id, // Only get roles with different tenure_id
      };
    } else {
      // If no tenure_id provided, get all active roles with non-null tenure_id
      whereConditionForActiveMemberRoles.tenure_id = {
        [require("sequelize").Op.not]: null,
      };
    }

    const activeMemberRoles = await MemberRole.findAll({
      where: whereConditionForActiveMemberRoles,
    });

    console.log(
      `Found ${activeMemberRoles.length} active roles with different tenure_id for member_id: ${member_id}`
    );

    //Make previous active roles with different tenure inactive
    if (activeMemberRoles.length > 0) {
      const whereConditionForUpdate = {
        member_id: member_id,
        status: "active",
      };

      // Only add tenure_id condition if tenure_id is provided and not null
      if (tenure_id && tenure_id !== null && tenure_id !== "") {
        whereConditionForUpdate.tenure_id = {
          [require("sequelize").Op.ne]: tenure_id, // Only update roles with different tenure_id
        };
      } else {
        // If no tenure_id provided, update all active roles with non-null tenure_id
        whereConditionForUpdate.tenure_id = {
          [require("sequelize").Op.not]: null,
        };
      }

      const updateResult = await MemberRole.update(
        { status: "inactive" },
        {
          where: whereConditionForUpdate,
        }
      );
      console.log(
        `Made ${activeMemberRoles.length} previous roles with different tenure_id inactive for member_id: ${member_id}. Updated rows: ${updateResult[0]}`
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
      tenure_id:
        tenure_id && tenure_id !== null && tenure_id !== ""
          ? parseInt(tenure_id)
          : null,
      level: level.toString(),
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
    const { member_id, role_id, institute_id, level, tenure_id, status } =
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
      tenure_id: tenure_id || memberRole.tenure_id,
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
