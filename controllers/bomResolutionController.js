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
  console.log("=== CREATE BOM RESOLUTION DEBUG ===");
  console.log("Request body:", req.body);
  console.log("Request files:", req.files);
  console.log(
    "Request files keys:",
    req.files ? Object.keys(req.files) : "No files object"
  );
  console.log(
    "Request file entries:",
    req.files ? JSON.stringify(req.files, null, 2) : "No files"
  );
  console.log("User info:", req.user);
  console.log("Content-Type header:", req.get("Content-Type"));

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

    // Enhanced file checking
    console.log("=== FILE VALIDATION ===");
    console.log("req.files exists:", !!req.files);
    console.log("req.files type:", typeof req.files);

    if (!req.files) {
      console.log("ERROR: No req.files found");
      return res
        .status(400)
        .json({ error: "No files uploaded - req.files is null/undefined" });
    }

    console.log("Available file fields:", Object.keys(req.files));

    // Check agenda file
    console.log("Checking agenda file...");
    console.log("req.files.agenda exists:", !!req.files.agenda);
    console.log("req.files.agenda:", req.files.agenda);

    if (
      !req.files.agenda ||
      !Array.isArray(req.files.agenda) ||
      req.files.agenda.length === 0
    ) {
      console.log("ERROR: Agenda file validation failed");
      console.log("- req.files.agenda exists:", !!req.files.agenda);
      console.log("- is array:", Array.isArray(req.files.agenda));
      console.log(
        "- length:",
        req.files.agenda ? req.files.agenda.length : "N/A"
      );
      return res.status(400).json({ error: "Agenda file is required" });
    }

    // Check resolution file
    console.log("Checking resolution file...");
    console.log("req.files.resolution exists:", !!req.files.resolution);
    console.log("req.files.resolution:", req.files.resolution);

    if (
      !req.files.resolution ||
      !Array.isArray(req.files.resolution) ||
      req.files.resolution.length === 0
    ) {
      console.log("ERROR: Resolution file validation failed");
      return res.status(400).json({ error: "Resolution file is required" });
    }

    // Extract file paths from uploaded files
    const filePaths = {
      agenda: req.files.agenda[0].filename,
      resolution: req.files.resolution[0].filename,
      compliance:
        req.files.compliance && req.files.compliance[0]
          ? req.files.compliance[0].filename
          : null,
    };

    console.log("File paths extracted:", filePaths);

    const bomResolution = await BOMResolution.create({
      agenda: filePaths.agenda,
      resolution: filePaths.resolution,
      compliance: filePaths.compliance,
      bom_date,
      tenure_id: tenure_id || null,
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
    // Handle both parameter names for backward compatibility
    const { searchText, query } = req.query;
    const searchQuery = searchText || query;
    const { usertypeid, id } = req.user;

    console.log("BOM PDF search request received:", {
      searchText,
      query,
      searchQuery,
      usertypeid,
      id,
    });

    if (!searchQuery || !searchQuery.trim()) {
      console.log("Empty search text, returning empty results");
      return res.json({ results: [] });
    }

    // Get BOM resolutions based on user permissions
    let resolutions = await BOMResolution.findAll({
      include: [
        {
          model: ManagementTenure,
          as: "managementTenure",
        },
      ],
      order: [["id", "DESC"]],
    });

    console.log("Found BOM resolutions to search:", resolutions.length);

    const searchTextLower = searchQuery.toLowerCase();
    const matchingResolutions = [];

    // Search through PDF files
    for (const resolution of resolutions) {
      console.log(`Searching BOM resolution ID ${resolution.id} with files:`, {
        agenda: resolution.agenda,
        resolution: resolution.resolution,
        compliance: resolution.compliance,
      });

      const pdfFields = ["agenda", "resolution", "compliance"];
      let foundMatch = false;

      for (const field of pdfFields) {
        if (resolution[field] && !foundMatch) {
          try {
            const pdfPath = path.join(
              __dirname,
              "../uploads",
              resolution[field]
            );
            console.log(`Checking BOM PDF: ${pdfPath}`);

            if (fs.existsSync(pdfPath)) {
              console.log(`Reading BOM PDF: ${resolution[field]}`);
              const dataBuffer = fs.readFileSync(pdfPath);
              const pdfData = await pdf(dataBuffer);
              const pdfText = pdfData.text.toLowerCase();
              console.log(
                `BOM PDF text length: ${pdfText.length}, searching for: ${searchTextLower}`
              );

              if (pdfText.includes(searchTextLower)) {
                console.log(
                  `MATCH FOUND in ${field} for BOM resolution ${resolution.id}`
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
                  `No match in ${field} for BOM resolution ${resolution.id}`
                );
              }
            } else {
              console.log(`BOM PDF file not found: ${pdfPath}`);
            }
          } catch (error) {
            console.error(
              `Error reading BOM PDF ${resolution[field]}:`,
              error.message
            );
            // Continue to next PDF even if one fails
          }
        }
      }
    }

    console.log(
      `BOM Search completed. Found ${matchingResolutions.length} matching resolutions`
    );

    res.json({
      results: matchingResolutions,
      searchText: searchQuery,
      totalFound: matchingResolutions.length,
    });
  } catch (error) {
    console.error("Error searching BOM PDF content:", error);
    res.status(500).json({ error: "Failed to search BOM PDF content" });
  }
};
