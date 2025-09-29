const {
  GCResolution,
  Member,
  MemberRole,
  Role,
  BOMResolution,
  Institute,
} = require("../models");
const fs = require("fs");
const path = require("path");

// Helper function to delete a file from the server
const deleteFileFromServer = (filename) => {
  if (!filename) return;

  const filePath = path.join(__dirname, "../uploads", filename);

  // Check if file exists before attempting to delete
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Error deleting file ${filename}:`, err);
      } else {
        console.log(`Successfully deleted file: ${filename}`);
      }
    });
  } else {
    console.log(`File ${filename} does not exist, skipping deletion`);
  }
};

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

    // Handle file updates
    if (req.files) {
      // Update file paths only if new files are uploaded
      // Also delete old files when they are replaced
      if (req.files.agenda) {
        if (gcResolution.agenda) {
          console.log(
            `Replacing agenda file: ${gcResolution.agenda} with ${req.files.agenda[0].filename}`
          );
          deleteFileFromServer(gcResolution.agenda);
        }
        updateData.agenda = req.files.agenda[0].filename;
      }
      if (req.files.resolution) {
        if (gcResolution.resolution) {
          console.log(
            `Replacing resolution file: ${gcResolution.resolution} with ${req.files.resolution[0].filename}`
          );
          deleteFileFromServer(gcResolution.resolution);
        }
        updateData.resolution = req.files.resolution[0].filename;
      }
      if (req.files.compliance) {
        if (gcResolution.compliance) {
          console.log(
            `Replacing compliance file: ${gcResolution.compliance} with ${req.files.compliance[0].filename}`
          );
          deleteFileFromServer(gcResolution.compliance);
        }
        updateData.compliance = req.files.compliance[0].filename;
      }
      if (req.files.meeting_notes) {
        if (gcResolution.meeting_notes) {
          console.log(
            `Replacing meeting_notes file: ${gcResolution.meeting_notes} with ${req.files.meeting_notes[0].filename}`
          );
          deleteFileFromServer(gcResolution.meeting_notes);
        }
        updateData.meeting_notes = req.files.meeting_notes[0].filename;
      }
    }

    // Handle existing files (preserve them if no new file uploaded)
    const fileFields = ["agenda", "resolution", "compliance", "meeting_notes"];
    fileFields.forEach((field) => {
      const existingFieldKey = `existing_${field}`;
      if (req.body[existingFieldKey] && !req.files?.[field]) {
        // Keep existing file if no new file uploaded
        updateData[field] = req.body[existingFieldKey];
      }
    });

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

    // Delete all associated files before deleting the record
    const fileFields = ["agenda", "resolution", "compliance", "meeting_notes"];
    console.log(`Deleting GC Resolution ${id} and associated files`);
    fileFields.forEach((field) => {
      if (gcResolution[field]) {
        console.log(`Deleting ${field} file: ${gcResolution[field]}`);
        deleteFileFromServer(gcResolution[field]);
      }
    });

    await gcResolution.destroy();

    res.json({
      message: "Resolution and associated files deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting GC resolution:", err);
    res.status(400).json({ error: err.message });
  }
};
