const {
  GCResolution,
  Member,
  MemberRole,
  Role,
  Institute,
  ManagementTenure,
} = require("../models");
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");

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
exports.getAllGCResolutions = async (req, res) => {
  try {
    const { usertypeid, id } = req.user;
    const { tenure_id } = req.query;
    const whereClause = {};
    if (tenure_id) whereClause.tenure_id = tenure_id;

    // Admin
    if (usertypeid === 1) {
      const resolutions = await GCResolution.findAll({
        where: whereClause,
        order: [["id", "DESC"]],
      });
      return res.json({ resolutions });
    }

    // Institute admin
    if (usertypeid === 2) {
      const resolutions = await GCResolution.findAll({
        where: { institute_id: req.user.institute_id, ...whereClause },
        order: [["id", "DESC"]],
      });
      return res.json({ resolutions });
    }

    // Member
    if (usertypeid === 3) {
      const member = await Member.findOne({ where: { userid: id } });
      if (!member) return res.status(404).json({ error: "Member not found" });

      const memberRoles = await MemberRole.findAll({
        //where: { member_id: member.id, status: "active" },
        include: [{ model: Role, as: "role" }],
      });

      const hasSpecialRole = memberRoles.some(
        (mr) =>
          mr.role &&
          (mr.role.role_name === "President" ||
            mr.role.role_name === "Vice President")
      );

      if (hasSpecialRole) {
        const resolutions = await GCResolution.findAll({
          where: whereClause,
          order: [["id", "DESC"]],
        });
        return res.json({ resolutions });
      }

      // regular member -> get institute ids they belong to
      const instituteIds = [
        ...new Set(
          memberRoles
            .map((mr) => mr.institute_id)
            .filter((institute_id) => institute_id != null)
        ),
      ];

      if (instituteIds.length === 0) {
        return res.status(200).json({ resolutions: [], institutes: [] });
      }

      // Fetch institute records (even if no resolutions)
      const institutes = await Institute.findAll({
        where: { id: { [Op.in]: instituteIds } },
        attributes: ["id", "name"],
      });

      // Fetch resolutions for those institutes (may be empty)
      const resolutions = await GCResolution.findAll({
        where: { institute_id: { [Op.in]: instituteIds }, ...whereClause },
        order: [["id", "DESC"]],
      });

      const byInstitute = institutes.map((inst) => ({
        institute: inst,
        resolutions: resolutions.filter((r) => r.institute_id === inst.id),
      }));

      return res.json({ resolutions, institutes, byInstitute });
    }

    // fallback
    return res.json({ resolutions: [] });
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
    // Check user permissions
    if (req.user.usertypeid !== 2) {
      return res.status(403).json({
        error: "Only institute admin can add GC resolutions",
      });
    }

    // Check if user has institute_id
    if (!req.user.institute_id) {
      return res.status(400).json({
        error: "User institute information is missing",
      });
    }

    const { gc_date, tenure_id } = req.body;

    // Validate required fields
    if (!gc_date) {
      return res.status(400).json({ error: "GC date is required" });
    }

    // Add validation for tenure_id - NOW REQUIRED
    if (!tenure_id || tenure_id.trim() === "") {
      return res.status(400).json({ error: "Management tenure is required" });
    }

    // Validate date format
    const parsedDate = new Date(gc_date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // Validate tenure_id exists in database
    const tenureExists = await ManagementTenure.findByPk(tenure_id);
    if (!tenureExists) {
      return res.status(400).json({ error: "Invalid tenure ID" });
    }

    // Check if agenda file is uploaded (REQUIRED field in DB)
    // if (!req.files || !req.files.agenda || req.files.agenda.length === 0) {
    //   return res.status(400).json({ error: "Agenda file is required" });
    // }

    // Validate that agenda file was processed correctly
    if (!req.files.agenda[0] || !req.files.agenda[0].filename) {
      return res.status(400).json({ error: "Agenda file upload failed" });
    }

    // Extract file paths from uploaded files
    const filePaths = {};

    try {
      // Agenda is required - must have a filename
      if (
        req.files.agenda &&
        req.files.agenda[0] &&
        req.files.agenda[0].filename
      ) {
        filePaths.agenda = req.files.agenda[0].filename;
        console.log("Agenda file saved as:", filePaths.agenda);
      } else {
        throw new Error("Agenda file processing failed - no filename");
      }

      // Optional files
      if (
        req.files.resolution &&
        req.files.resolution[0] &&
        req.files.resolution[0].filename
      ) {
        filePaths.resolution = req.files.resolution[0].filename;
        console.log("Resolution file saved as:", filePaths.resolution);
      }

      if (
        req.files.compliance &&
        req.files.compliance[0] &&
        req.files.compliance[0].filename
      ) {
        filePaths.compliance = req.files.compliance[0].filename;
        console.log("Compliance file saved as:", filePaths.compliance);
      }

      if (
        req.files.meeting_notes &&
        req.files.meeting_notes[0] &&
        req.files.meeting_notes[0].filename
      ) {
        filePaths.meeting_notes = req.files.meeting_notes[0].filename;
        console.log("Meeting notes file saved as:", filePaths.meeting_notes);
      }
    } catch (fileError) {
      console.error("Error processing uploaded files:", fileError);
      return res.status(400).json({
        error: "Error processing uploaded files: " + fileError.message,
      });
    }

    // Create the GC resolution - match exact DB schema
    const gcResolutionData = {
      agenda: filePaths.agenda, // Required field - NOT NULL in DB
      resolution: filePaths.resolution || null, // Optional
      compliance: filePaths.compliance || null, // Optional
      meeting_notes: filePaths.meeting_notes || null, // Optional
      gc_date: parsedDate, // Required field - NOT NULL in DB
      institute_id: req.user.institute_id, // Required field - NOT NULL in DB
      tenure_id: parseInt(tenure_id), // Required field - NOW MANDATORY
    };

    console.log("Creating GC Resolution with data:", gcResolutionData);

    // Validate required fields before database operation
    // if (!gcResolutionData.agenda) {
    //   throw new Error("Agenda filename is required but missing");
    // }
    if (!gcResolutionData.gc_date) {
      throw new Error("GC date is required but missing");
    }
    if (!gcResolutionData.institute_id) {
      throw new Error("Institute ID is required but missing");
    }

    const gcResolution = await GCResolution.create(gcResolutionData);

    console.log("Successfully created GC Resolution:", {
      id: gcResolution.id,
      agenda: gcResolution.agenda,
      resolution: gcResolution.resolution,
      compliance: gcResolution.compliance,
      meeting_notes: gcResolution.meeting_notes,
      gc_date: gcResolution.gc_date,
      institute_id: gcResolution.institute_id,
      tenure_id: gcResolution.tenure_id,
    });

    res.status(201).json({
      success: true,
      message: "GC Resolution created successfully",
      data: gcResolution,
    });
  } catch (err) {
    console.error("Error creating GC resolution:", err);

    // Clean up uploaded files if database operation failed
    if (req.files) {
      Object.values(req.files).forEach((fileArray) => {
        if (Array.isArray(fileArray)) {
          fileArray.forEach((file) => {
            if (file && file.filename) {
              deleteFileFromServer(file.filename);
            }
          });
        }
      });
    }

    // Return specific error messages
    if (err.name === "SequelizeValidationError") {
      return res.status(400).json({
        error:
          "Validation error: " + err.errors.map((e) => e.message).join(", "),
      });
    }

    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({
        error:
          "Foreign key constraint error. Please check institute_id and tenure_id.",
      });
    }

    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        error:
          "Duplicate entry. A resolution with similar data already exists.",
      });
    }

    if (
      err.name === "SequelizeDatabaseError" &&
      err.message.includes("null value")
    ) {
      return res.status(400).json({
        error:
          "Required field missing. Please ensure all required fields are provided.",
      });
    }

    res.status(500).json({
      error: "Failed to save resolution. Please try again.",
    });
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
    // Admin can update any resolution, members cannot update
    if (req.user.usertypeid !== 1 && req.user.usertypeid !== 2) {
      return res
        .status(403)
        .json({ error: "Unauthorized to update resolutions" });
    }

    // Validate date format if provided
    let parsedDate = gcResolution.gc_date;
    if (gc_date) {
      parsedDate = new Date(gc_date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }
    }

    // Validate tenure_id if provided
    if (tenure_id && tenure_id.trim() !== "") {
      const tenureExists = await ManagementTenure.findByPk(tenure_id);
      if (!tenureExists) {
        return res.status(400).json({ error: "Invalid tenure ID" });
      }
    }

    // Prepare update data with existing values as defaults
    const updateData = {
      gc_date: parsedDate,
      tenure_id:
        tenure_id && tenure_id.trim() !== ""
          ? parseInt(tenure_id)
          : gcResolution.tenure_id,
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

    // Clean up uploaded files if database operation failed
    if (req.files) {
      Object.values(req.files).forEach((fileArray) => {
        if (Array.isArray(fileArray)) {
          fileArray.forEach((file) => {
            if (file && file.filename) {
              deleteFileFromServer(file.filename);
            }
          });
        }
      });
    }

    res.status(500).json({ error: err.message });
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

// Search PDF content
exports.searchPDFContent = async (req, res) => {
  try {
    const { searchText } = req.query;
    const { usertypeid, id } = req.user;

    console.log("PDF search request received:", { searchText, usertypeid, id });

    if (!searchText || !searchText.trim()) {
      console.log("Empty search text, returning empty results");
      return res.json({ results: [] });
    }

    let resolutions = [];

    // Get resolutions based on user type
    if (usertypeid === 1) {
      // Admin: all resolutions
      resolutions = await GCResolution.findAll({
        include: [
          {
            model: Institute,
            attributes: ["id", "name"],
          },
        ],
        order: [["id", "DESC"]],
      });
    } else if (usertypeid === 2) {
      // Institute admin: only their institute's resolutions
      resolutions = await GCResolution.findAll({
        where: { institute_id: req.user.institute_id },
        include: [
          {
            model: Institute,
            attributes: ["id", "name"],
          },
        ],
        order: [["id", "DESC"]],
      });
    } else if (usertypeid === 3) {
      // Member: check if President or Vice President, else restrict to their institutes
      const member = await Member.findOne({ where: { userid: id } });
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      // Fetch member roles (ignore status) with institute_id and include role
      const memberRoles = await MemberRole.findAll({
        where: { member_id: member.id },
        include: [{ model: Role, as: "role" }],
      });

      // Check if any role is President or Vice President
      const hasSpecialRole = memberRoles.some((mr) => {
        if (!mr.role) return false;
        const rn = String(mr.role.role_name).toLowerCase();
        return (
          rn === "president" ||
          rn === "vice president" ||
          rn === "chairman" ||
          rn === "secretary" ||
          rn === "member"
        );
      });

      if (hasSpecialRole) {
        // President or Vice President: view all resolutions
        resolutions = await GCResolution.findAll({
          include: [
            {
              model: Institute,
              attributes: ["id", "name"],
            },
          ],
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
          where: { institute_id: { [Op.in]: instituteIds } },
          include: [
            {
              model: Institute,
              attributes: ["id", "name"],
            },
          ],
          order: [["id", "DESC"]],
        });
      }
    }

    console.log("Found resolutions to search:", resolutions.length);

    const searchTextLower = searchText.toLowerCase();
    const matchingResolutions = [];

    // Search through PDF files - using correct field names from schema
    for (const resolution of resolutions) {
      console.log(`Searching resolution ID ${resolution.id} with files:`, {
        agenda: resolution.agenda,
        resolution: resolution.resolution,
        compliance: resolution.compliance,
        meeting_notes: resolution.meeting_notes,
      });

      const pdfFields = ["agenda", "resolution", "compliance", "meeting_notes"];
      let foundMatch = false;

      for (const field of pdfFields) {
        if (resolution[field] && !foundMatch) {
          try {
            const pdfPath = path.join(
              __dirname,
              "../uploads",
              resolution[field]
            );
            console.log(`Checking PDF: ${pdfPath}`);

            if (fs.existsSync(pdfPath)) {
              console.log(`Reading PDF: ${resolution[field]}`);
              const dataBuffer = fs.readFileSync(pdfPath);
              const pdfData = await pdf(dataBuffer);
              const pdfText = pdfData.text.toLowerCase();
              console.log(
                `PDF text length: ${pdfText.length}, searching for: ${searchTextLower}`
              );

              if (pdfText.includes(searchTextLower)) {
                console.log(
                  `MATCH FOUND in ${field} for resolution ${resolution.id}`
                );
                matchingResolutions.push({
                  ...resolution.toJSON(),
                  matchedField: field,
                  matchedIn: field.replace("_", " "),
                });
                foundMatch = true;
                break;
              } else {
                console.log(
                  `No match in ${field} for resolution ${resolution.id}`
                );
              }
            } else {
              console.log(`PDF file not found: ${pdfPath}`);
            }
          } catch (error) {
            console.error(
              `Error reading PDF ${resolution[field]}:`,
              error.message
            );
            // Continue to next PDF even if one fails
          }
        }
      }
    }

    console.log(
      `Search completed. Found ${matchingResolutions.length} matching resolutions`
    );

    res.json({
      results: matchingResolutions,
      searchText: searchText,
      totalFound: matchingResolutions.length,
    });
  } catch (error) {
    console.error("Error searching PDF content:", error);
    res.status(500).json({ error: "Failed to search PDF content" });
  }
};

/**
 * Get GC resolutions for a specific member and tenure
 * Checks member_roles table for authorization (includes all statuses for that tenure)
 */
exports.getGCResolutionsByMemberAndTenure = async (req, res) => {
  try {
    const { memberId, tenureId } = req.params;

    console.log(
      `Fetching GC resolutions for member ${memberId} and tenure ${tenureId}`
    );

    // Validate input parameters
    if (!memberId || !tenureId) {
      return res.status(400).json({
        success: false,
        message: "Member ID and Tenure ID are required",
      });
    }

    // Step 1: Check if member had roles for the given tenure (any status)
    // Member should see resolutions for all institutes they were associated with during that tenure
    const memberRoles = await MemberRole.findAll({
      where: {
        member_id: memberId,
        tenure_id: tenureId,
        // No status filter - member had access during this tenure regardless of current status
      },
      include: [
        {
          model: Institute,
          as: "institute", // Adjust this alias based on your model associations
          attributes: ["id", "name", "code"],
        },
        {
          model: Role,
          as: "role",
          attributes: ["id", "role_name"],
        },
      ],
    });

    console.log(
      `Found ${memberRoles.length} institute roles for member ${memberId} in tenure ${tenureId} (all statuses)`
    );

    if (memberRoles.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Member had no roles for the specified tenure",
        data: {
          member_id: parseInt(memberId),
          tenure_id: parseInt(tenureId),
          accessible_institutes: [],
        },
      });
    }

    // Step 2: Get institute IDs where member had access during that tenure
    const accessibleInstituteIds = memberRoles.map((role) => role.institute_id);

    // Step 3: Fetch GC resolutions for the accessible institutes and tenure
    const gcResolutions = await GCResolution.findAll({
      where: {
        tenure_id: tenureId,
        institute_id: { [Op.in]: accessibleInstituteIds },
      },
      include: [
        {
          model: Institute,
          attributes: ["id", "name", "code"],
        },
        {
          model: ManagementTenure,
          attributes: ["id", "tenure", "start_date", "end_date"],
        },
      ],
      order: [
        ["gc_date", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    console.log(
      `Found ${gcResolutions.length} GC resolutions for accessible institutes`
    );

    // Step 4: Group resolutions by institute for better organization
    const resolutionsByInstitute = {};
    gcResolutions.forEach((resolution) => {
      const instituteId = resolution.institute_id;
      if (!resolutionsByInstitute[instituteId]) {
        resolutionsByInstitute[instituteId] = {
          institute: {
            id: instituteId,
            name: resolution.Institute.name,
            code: resolution.Institute.code,
          },
          resolutions: [],
        };
      }
      resolutionsByInstitute[instituteId].resolutions.push(resolution);
    });

    // Step 5: Prepare accessible institutes data with status information
    const accessibleInstitutes = memberRoles.map((role) => ({
      id: role.institute_id,
      name: role.institute?.name || "Unknown Institute",
      code: role.institute?.code || "N/A",
      member_role: role.role?.role_name || "Unknown Role",
      status: role.status || "unknown", // Show the status for reference
      was_active_during_tenure: true, // They had access during this tenure
    }));

    // Step 6: Calculate summary statistics
    const uniqueMeetingDates = [
      ...new Set(gcResolutions.map((r) => r.gc_date)),
    ];

    return res.status(200).json({
      success: true,
      message: `Found ${gcResolutions.length} GC resolutions for ${memberRoles.length} institutes where member had roles during tenure ${tenureId}`,
      data: {
        member_id: parseInt(memberId),
        tenure_id: parseInt(tenureId),
        accessible_institutes: accessibleInstitutes,
        resolutions: gcResolutions,
        resolutions_by_institute: resolutionsByInstitute,
        summary: {
          total_resolutions: gcResolutions.length,
          total_institutes: memberRoles.length,
          unique_meeting_dates: uniqueMeetingDates.length,
          date_range: {
            first_meeting:
              gcResolutions.length > 0
                ? Math.min(...gcResolutions.map((r) => new Date(r.gc_date)))
                : null,
            last_meeting:
              gcResolutions.length > 0
                ? Math.max(...gcResolutions.map((r) => new Date(r.gc_date)))
                : null,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error in getGCResolutionsByMemberAndTenure:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching GC resolutions",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get GC resolutions for a specific member, tenure, and institute
 * Includes authorization check (any status for that tenure)
 */
exports.getGCResolutionsByMemberTenureAndInstitute = async (req, res) => {
  try {
    const { memberId, tenureId, instituteId } = req.params;

    console.log(
      `Fetching GC resolutions for member ${memberId}, tenure ${tenureId}, institute ${instituteId}`
    );

    // Validate input parameters
    if (!memberId || !tenureId || !instituteId) {
      return res.status(400).json({
        success: false,
        message: "Member ID, Tenure ID, and Institute ID are required",
      });
    }

    // Step 1: Verify member had access to this institute during this tenure (any status)
    const accessCheck = await MemberRole.findOne({
      where: {
        member_id: memberId,
        tenure_id: tenureId,
        institute_id: instituteId,
        // No status filter - if they had a role during that tenure, they can see the resolutions
      },
      include: [
        {
          model: Institute,
          as: "institute",
          attributes: ["id", "name", "code", "address"],
        },
        {
          model: Role,
          as: "role",
          attributes: ["id", "role_name"],
        },
        {
          model: ManagementTenure,
          as: "tenure", // Adjust alias based on your associations
          attributes: ["id", "tenure", "start_date", "end_date"],
        },
      ],
    });

    if (!accessCheck) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied: Member did not have access to this institute during the specified tenure",
        data: {
          member_id: parseInt(memberId),
          tenure_id: parseInt(tenureId),
          institute_id: parseInt(instituteId),
        },
      });
    }

    // Step 2: Fetch GC resolutions for the specific institute and tenure
    const gcResolutions = await GCResolution.findAll({
      where: {
        tenure_id: tenureId,
        institute_id: instituteId,
      },
      include: [
        {
          model: Institute,
          attributes: ["id", "name", "code"],
        },
        {
          model: ManagementTenure,
          attributes: ["id", "tenure", "start_date", "end_date"],
        },
      ],
      order: [
        ["gc_date", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    // Step 3: Group resolutions by date for better organization
    const resolutionsByDate = {};
    gcResolutions.forEach((resolution) => {
      const dateKey = resolution.gc_date || "no-date";
      if (!resolutionsByDate[dateKey]) {
        resolutionsByDate[dateKey] = [];
      }
      resolutionsByDate[dateKey].push(resolution);
    });

    // Step 4: Calculate statistics
    const statistics = {
      total_resolutions: gcResolutions.length,
      unique_meeting_dates: [...new Set(gcResolutions.map((r) => r.gc_date))]
        .length,
      resolutions_with_agenda: gcResolutions.filter((r) => r.agenda).length,
      resolutions_with_resolution: gcResolutions.filter((r) => r.resolution)
        .length,
      resolutions_with_compliance: gcResolutions.filter((r) => r.compliance)
        .length,
      resolutions_with_notes: gcResolutions.filter((r) => r.meeting_notes)
        .length,
      date_range: {
        first_meeting:
          gcResolutions.length > 0
            ? Math.min(...gcResolutions.map((r) => new Date(r.gc_date)))
            : null,
        last_meeting:
          gcResolutions.length > 0
            ? Math.max(...gcResolutions.map((r) => new Date(r.gc_date)))
            : null,
      },
    };

    return res.status(200).json({
      success: true,
      message: `Found ${gcResolutions.length} GC resolutions for the specified criteria`,
      data: {
        member_id: parseInt(memberId),
        tenure_id: parseInt(tenureId),
        institute_id: parseInt(instituteId),
        member_role: accessCheck.role?.role_name || "Unknown Role",
        member_status_during_tenure: accessCheck.status || "unknown",
        institute: {
          name: accessCheck.institute?.name || "Unknown Institute",
          code: accessCheck.institute?.code || "N/A",
          address: accessCheck.institute?.address || null,
        },
        tenure: {
          name: accessCheck.tenure?.tenure || "Unknown Tenure",
          start_date: accessCheck.tenure?.start_date || null,
          end_date: accessCheck.tenure?.end_date || null,
        },
        resolutions: gcResolutions,
        resolutions_by_date: resolutionsByDate,
        statistics,
      },
    });
  } catch (error) {
    console.error(
      "Error in getGCResolutionsByMemberTenureAndInstitute:",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching GC resolutions",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get member's accessible institutes for a specific tenure
 * Shows all institutes where member had roles during that tenure (any status)
 */
exports.getMemberAccessibleInstitutes = async (req, res) => {
  try {
    const { memberId, tenureId } = req.params;

    console.log(
      `Fetching accessible institutes for member ${memberId} and tenure ${tenureId}`
    );

    if (!memberId || !tenureId) {
      return res.status(400).json({
        success: false,
        message: "Member ID and Tenure ID are required",
      });
    }

    // Get all member roles for the tenure (regardless of current status)
    const memberRoles = await MemberRole.findAll({
      where: {
        member_id: memberId,
        tenure_id: tenureId,
        // No status filter - show all institutes they were associated with during that tenure
      },
      include: [
        {
          model: Institute,
          as: "institute",
          attributes: ["id", "name", "code", "address"],
        },
        {
          model: Role,
          as: "role",
          attributes: ["id", "role_name"],
        },
      ],
    });

    console.log(`Member roles fetched: count=${memberRoles.length}`);
    // log a short snapshot to help debug unexpected shapes
    console.log(
      "Member roles sample:",
      memberRoles.slice(0, 5).map((mr) => ({
        member_id: mr.member_id,
        institute_id: mr.institute_id,
        role: mr.role?.role_name,
        institute: mr.institute?.name,
      }))
    );

    // Get resolution counts for each accessible institute
    const accessibleInstitutes = [];

    for (const memberRole of memberRoles) {
      try {
        const resolutionCount = await GCResolution.count({
          where: {
            institute_id: memberRole.institute_id,
            tenure_id: tenureId,
          },
        });

        accessibleInstitutes.push({
          id: memberRole.institute_id,
          name: memberRole.institute?.name || "Unknown Institute",
          code: memberRole.institute?.code || "N/A",
          address: memberRole.institute?.address || null,
          member_role: memberRole.role?.role_name || "Unknown Role",
          status_during_tenure: memberRole.status || "unknown",
          total_resolutions: resolutionCount,
        });
      } catch (innerErr) {
        console.error("Error processing memberRole", {
          memberRole: {
            member_id: memberRole.member_id,
            institute_id: memberRole.institute_id,
          },
          error: innerErr,
        });
        // continue with other roles rather than failing everything
      }
    }

    return res.status(200).json({
      success: true,
      message: `Found ${accessibleInstitutes.length} institutes where member had roles during tenure ${tenureId}`,
      data: {
        member_id: parseInt(memberId),
        tenure_id: parseInt(tenureId),
        accessible_institutes: accessibleInstitutes,
        total_institutes: accessibleInstitutes.length,
      },
    });
  } catch (error) {
    console.error("Error in getMemberAccessibleInstitutes:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching accessible institutes",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
