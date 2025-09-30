const { BOMResolution, ManagementTenure } = require("../models");
const path = require("path");
const fs = require("fs");
const pdf = require("pdf-parse");

const deleteFileFromServer = (filename) => {
  if (!filename) return;
  const filePath = path.join(__dirname, "../uploads", filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log("Deleted file:", filePath);
    } catch (err) {
      console.error("Error deleting file:", filePath, err);
    }
  }
};

// Admin can see all BOM resolutions, prepare BOM agenda
exports.getAllBOMResolutions = async (req, res) => {
  try {
    const { usertypeid, id } = req.user;
    let resolutions = [];
    if (usertypeid === 1 || usertypeid === 3) {
      // Admin and all members get all BOM resolutions, ordered by id DESC (latest first)
      resolutions = await BOMResolution.findAll({
        include: [
          {
            model: ManagementTenure,
            as: "managementTenure",
          },
        ],
        order: [["id", "DESC"]],
      });
    } else if (usertypeid === 2) {
      // Institute admin: For now, show all BOM resolutions
      resolutions = await BOMResolution.findAll({
        include: [
          {
            model: ManagementTenure,
            as: "managementTenure",
          },
        ],
        order: [["id", "DESC"]],
      });
    } else {
      return res.status(403).json({ error: "Unauthorized access" });
    }
    res.json(resolutions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin can create BOM agenda
exports.createBOMResolution = async (req, res) => {
  console.log("Request body:", req.body);
  console.log("Request files:", req.files);
  console.log("User info:", req.user);
  try {
    if (req.user.usertypeid !== 1) {
      return res
        .status(403)
        .json({ error: "Only admin can create BOM agenda" });
    }

    const { bom_date, tenure_id } = req.body;

    // Check required fields
    if (!bom_date) {
      return res.status(400).json({ error: "BOM date is required" });
    }

    // Check if at least agenda and resolution files are uploaded
    if (!req.files || !req.files.agenda || req.files.agenda.length === 0) {
      return res.status(400).json({ error: "Agenda file is required" });
    }
    if (!req.files.resolution || req.files.resolution.length === 0) {
      return res.status(400).json({ error: "Resolution file is required" });
    }

    // Extract file paths from uploaded files with error handling
    const filePaths = {};
    try {
      if (req.files.agenda && req.files.agenda[0]) {
        filePaths.agenda = req.files.agenda[0].filename;
        console.log("Agenda file saved as:", filePaths.agenda);
      }
      if (req.files.resolution && req.files.resolution[0]) {
        filePaths.resolution = req.files.resolution[0].filename;
        console.log("Resolution file saved as:", filePaths.resolution);
      }
      if (req.files.compliance && req.files.compliance[0]) {
        filePaths.compliance = req.files.compliance[0].filename;
        console.log("Compliance file saved as:", filePaths.compliance);
      }
    } catch (fileError) {
      console.error("Error processing uploaded files:", fileError);
      return res.status(400).json({ error: "Error processing uploaded files" });
    }

    const bomResolution = await BOMResolution.create({
      agenda: filePaths.agenda || null,
      resolution: filePaths.resolution || null,
      compliance: filePaths.compliance || null,
      bom_date,
      tenure_id,
    });

    // Fetch the created record with associations for response
    const createdRecord = await BOMResolution.findByPk(bomResolution.id, {
      include: [
        {
          model: ManagementTenure,
          as: "managementTenure",
        },
      ],
    });

    console.log("Created BOM Resolution with files:", {
      id: createdRecord.id,
      agenda: createdRecord.agenda,
      resolution: createdRecord.resolution,
      compliance: createdRecord.compliance,
    });

    res.status(201).json(createdRecord);
  } catch (err) {
    console.error("Error creating BOM resolution:", err);
    res.status(400).json({ error: err.message });
  }
};

// Admin can delete BOM resolution
exports.deleteBOMResolution = async (req, res) => {
  try {
    if (req.user.usertypeid !== 1) {
      return res
        .status(403)
        .json({ error: "Only admin can delete BOM resolution" });
    }
    const { id } = req.params;
    const bomResolution = await BOMResolution.findByPk(id);
    if (!bomResolution) {
      return res.status(404).json({ error: "BOM Resolution not found" });
    }

    // Delete associated files from server before deleting the record
    if (bomResolution.agenda) {
      deleteFileFromServer(bomResolution.agenda);
    }
    if (bomResolution.resolution) {
      deleteFileFromServer(bomResolution.resolution);
    }
    if (bomResolution.compliance) {
      deleteFileFromServer(bomResolution.compliance);
    }

    await bomResolution.destroy();

    console.log("Deleted BOM Resolution and associated files:", {
      id: bomResolution.id,
      agenda: bomResolution.agenda,
      resolution: bomResolution.resolution,
      compliance: bomResolution.compliance,
    });

    res.json({ message: "BOM Resolution deleted successfully" });
  } catch (err) {
    console.error("Error deleting BOM resolution:", err);
    res.status(500).json({ error: err.message });
  }
};

// Admin can update BOM resolution
exports.updateBOMResolution = async (req, res) => {
  console.log("Update request body:", req.body);
  console.log("Update request files:", req.files);
  console.log("User info:", req.user);
  try {
    if (req.user.usertypeid !== 1) {
      return res
        .status(403)
        .json({ error: "Only admin can update BOM resolution" });
    }
    const { id } = req.params;
    const { bom_date, tenure_id } = req.body;

    const bomResolution = await BOMResolution.findByPk(id);
    if (!bomResolution) {
      return res.status(404).json({ error: "BOM Resolution not found" });
    }

    // Store old file names for deletion if replaced
    const oldFiles = {
      agenda: bomResolution.agenda,
      resolution: bomResolution.resolution,
      compliance: bomResolution.compliance,
    };

    // Extract file paths from uploaded files (if any)
    const filePaths = {};
    if (req.files) {
      if (req.files.agenda) {
        filePaths.agenda = req.files.agenda[0].filename;
        console.log("Updated agenda file saved as:", filePaths.agenda);
        // Delete old agenda file if it exists
        if (oldFiles.agenda) {
          deleteFileFromServer(oldFiles.agenda);
        }
      }
      if (req.files.resolution) {
        filePaths.resolution = req.files.resolution[0].filename;
        console.log("Updated resolution file saved as:", filePaths.resolution);
        // Delete old resolution file if it exists
        if (oldFiles.resolution) {
          deleteFileFromServer(oldFiles.resolution);
        }
      }
      if (req.files.compliance) {
        filePaths.compliance = req.files.compliance[0].filename;
        console.log("Updated compliance file saved as:", filePaths.compliance);
        // Delete old compliance file if it exists
        if (oldFiles.compliance) {
          deleteFileFromServer(oldFiles.compliance);
        }
      }
    }

    // Update the record
    const updatedBomResolution = await bomResolution.update({
      agenda: filePaths.agenda || bomResolution.agenda,
      resolution: filePaths.resolution || bomResolution.resolution,
      compliance: filePaths.compliance || bomResolution.compliance,
      bom_date: bom_date || bomResolution.bom_date,
      tenure_id: tenure_id || bomResolution.tenure_id,
    });

    // Fetch the updated record with associations for response
    const updatedRecord = await BOMResolution.findByPk(id, {
      include: [
        {
          model: ManagementTenure,
          as: "managementTenure",
        },
      ],
    });

    console.log("Updated BOM Resolution with files:", {
      id: updatedRecord.id,
      agenda: updatedRecord.agenda,
      resolution: updatedRecord.resolution,
      compliance: updatedRecord.compliance,
    });

    res.json(updatedRecord);
  } catch (err) {
    console.error("Error updating BOM resolution:", err);
    res.status(400).json({ error: err.message });
  }
};

// Search PDF content
exports.searchPDFContent = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    // Get all BOM resolutions
    const resolutions = await BOMResolution.findAll({
      include: [
        {
          model: ManagementTenure,
          as: "managementTenure",
        },
      ],
    });

    const searchResults = [];

    for (const resolution of resolutions) {
      const files = [
        { type: "agenda", filename: resolution.agenda },
        { type: "resolution", filename: resolution.resolution },
        { type: "compliance", filename: resolution.compliance },
      ].filter((f) => f.filename);

      for (const file of files) {
        const filePath = path.join(__dirname, "../uploads", file.filename);
        if (
          fs.existsSync(filePath) &&
          path.extname(file.filename).toLowerCase() === ".pdf"
        ) {
          try {
            const dataBuffer = fs.readFileSync(filePath);
            const pdfData = await pdf(dataBuffer);

            if (pdfData.text.toLowerCase().includes(query.toLowerCase())) {
              searchResults.push({
                resolution_id: resolution.id,
                file_type: file.type,
                filename: file.filename,
                bom_date: resolution.bom_date,
                managementTenure: resolution.managementTenure,
              });
            }
          } catch (pdfError) {
            console.error(`Error reading PDF ${file.filename}:`, pdfError);
          }
        }
      }
    }

    res.json(searchResults);
  } catch (err) {
    console.error("Error searching PDFs:", err);
    res.status(500).json({ error: err.message });
  }
};
