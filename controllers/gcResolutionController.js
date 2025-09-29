const {
  GCResolution,
  Member,
  MemberRole,
  Role,
  BOMResolution,
  Institute,
} = require("../models");

// Get all GC resolutions (admin sees all, institute admin sees only their own)
//condition addeed
exports.getAllGCResolutions = async (req, res) => {
  try {
    const { usertypeid, id } = req.user;
    const { tenure_id } = req.query; // Add tenure filtering from query params
    let resolutions = [];

    // Build where clause for tenure filtering
    const whereClause = {};
    if (tenure_id) {
      whereClause.tenure_id = tenure_id;
    }

    if (usertypeid === 1) {
      // Admin: all resolutions, latest first
      resolutions = await GCResolution.findAll({
        where: whereClause,
        order: [["id", "DESC"]],
      });
    } else if (usertypeid === 2) {
      // Institute admin: only their institute's resolutions, latest first
      resolutions = await GCResolution.findAll({
        where: {
          institute_id: req.user.institute_id,
          ...whereClause,
        },
        order: [["id", "DESC"]],
      });
    } else if (usertypeid === 3) {
      // Member: check if President or Vice President, else restrict to their institutes
      const member = await Member.findOne({ where: { userid: id } });
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }
      // Fetch active member roles with institute_id and include role
      const memberRoles = await MemberRole.findAll({
        where: { member_id: member.id, status: "active" },
        include: [{ model: Role, as: "role" }],
      });
      // Check if any role is President or Vice President
      const hasSpecialRole = memberRoles.some(
        (mr) =>
          mr.role &&
          (mr.role.role_name === "President" ||
            mr.role.role_name === "Vice President")
      );
      if (hasSpecialRole) {
        // President or Vice President: view all resolutions
        resolutions = await GCResolution.findAll({
          where: whereClause,
          order: [["id", "DESC"]],
        });
      } else {
        // Regular member: only their institutes
        const instituteIds = [
          ...new Set(
            memberRoles
              .map((mr) => mr.institute_id)
              .filter((institute_id) => institute_id != null)
          ),
        ];
        if (instituteIds.length === 0) {
          return res
            .status(400)
            .json({ error: "Member does not belong to any institute" });
        }
        resolutions = await GCResolution.findAll({
          where: {
            institute_id: instituteIds,
            ...whereClause,
          },
          order: [["id", "DESC"]],
        });
      }
    }

    return res.json({ resolutions });
  } catch (err) {
    console.error("Error in getAllGCResolutions:", err);
    res.status(500).json({ error: err.message });
  }
};

// Institute admin can add GC resolution
exports.createGCResolution = async (req, res) => {
  console.log("Request body:", req.body);
  console.log("Request files:", req.files);
  console.log("User info:", req.user);
  try {
    if (req.user.usertypeid !== 2) {
      return res
        .status(403)
        .json({ error: "Only institute admin can add GC resolutions" });
    }

    const { gc_date, tenure_id } = req.body;

    // Check required fields
    if (!gc_date) {
      return res.status(400).json({ error: "GC date is required" });
    }

    // Check if at least agenda file is uploaded
    if (!req.files || !req.files.agenda) {
      return res.status(400).json({ error: "Agenda file is required" });
    }

    // Extract file paths from uploaded files
    const filePaths = {};
    if (req.files.agenda) {
      filePaths.agenda = req.files.agenda[0].filename;
      console.log("Agenda file saved as:", filePaths.agenda);
    }
    if (req.files.resolution) {
      filePaths.resolution = req.files.resolution[0].filename;
      console.log("Resolution file saved as:", filePaths.resolution);
    }
    if (req.files.compliance) {
      filePaths.compliance = req.files.compliance[0].filename;
      console.log("Compliance file saved as:", filePaths.compliance);
    }
    if (req.files.meeting_notes) {
      filePaths.meeting_notes = req.files.meeting_notes[0].filename;
      console.log("Meeting notes file saved as:", filePaths.meeting_notes);
    }

    const gcResolution = await GCResolution.create({
      agenda: filePaths.agenda || null,
      resolution: filePaths.resolution || null,
      compliance: filePaths.compliance || null,
      meeting_notes: filePaths.meeting_notes || null,
      gc_date,
      institute_id: req.user.institute_id,
      tenure_id,
    });

    console.log("Created GC Resolution with files:", {
      id: gcResolution.id,
      agenda: gcResolution.agenda,
      resolution: gcResolution.resolution,
      compliance: gcResolution.compliance,
      meeting_notes: gcResolution.meeting_notes,
    });

    res.status(201).json(gcResolution);
  } catch (err) {
    console.error("Error creating GC resolution:", err);
    res.status(400).json({ error: err.message });
  }
};

// Update a GC resolution
exports.updateGCResolution = async (req, res) => {
  try {
    const { id } = req.params;
    const { gc_date, tenure_id } = req.body;

    const gcResolution = await GCResolution.findByPk(id);
    if (!gcResolution) {
      return res.status(404).json({ error: "Resolution not found" });
    }

    // Check if the user has permission to update this resolution
    if (
      req.user.usertypeid === 2 &&
      gcResolution.institute_id !== req.user.institute_id
    ) {
      return res
        .status(403)
        .json({ error: "You can only update resolutions of your institute" });
    }

    // Prepare update data with existing values as defaults
    const updateData = {
      gc_date: gc_date || gcResolution.gc_date,
      tenure_id: tenure_id || gcResolution.tenure_id,
    };

    // Update file paths only if new files are uploaded
    if (req.files) {
      if (req.files.agenda) updateData.agenda = req.files.agenda[0].filename;
      if (req.files.resolution)
        updateData.resolution = req.files.resolution[0].filename;
      if (req.files.compliance)
        updateData.compliance = req.files.compliance[0].filename;
      if (req.files.meeting_notes)
        updateData.meeting_notes = req.files.meeting_notes[0].filename;
    }

    await gcResolution.update(updateData);

    res.json(gcResolution);
  } catch (err) {
    console.error("Error updating GC resolution:", err);
    res.status(400).json({ error: err.message });
  }
};

// Delete a GC resolution
exports.deleteGCResolution = async (req, res) => {
  try {
    const { id } = req.params;

    const gcResolution = await GCResolution.findByPk(id);
    if (!gcResolution) {
      return res.status(404).json({ error: "Resolution not found" });
    }

    // Check if the user has permission to delete this resolution
    if (
      req.user.usertypeid === 2 &&
      gcResolution.institute_id !== req.user.institute_id
    ) {
      return res
        .status(403)
        .json({ error: "You can only delete resolutions of your institute" });
    }

    await gcResolution.destroy();

    res.json({ message: "Resolution deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
