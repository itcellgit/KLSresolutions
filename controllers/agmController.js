const { AGM } = require("../models");
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

exports.createAGM = async (req, res) => {
  console.log("Request body:", req.body);
  console.log("Request files:", req.files);
  console.log(
    "Request files keys:",
    req.files ? Object.keys(req.files) : "No files object"
  );
  console.log("User info:", req.user);
  console.log("Content-Type:", req.get("Content-Type"));

  try {
    if (!req.user || req.user.usertypeid !== 1) {
      return res.status(403).json({ error: "Only admin can create AGM" });
    }

    // Accept multiple field names for date
    let agm_date =
      req.body && (req.body.agm_date || req.body.date || req.body.agmDate);

    // If body parser produced arrays for multipart/form-data, take first
    if (typeof agm_date === "object" && agm_date !== null) {
      if (Array.isArray(agm_date) && agm_date.length > 0)
        agm_date = agm_date[0];
      else if (agm_date.hasOwnProperty("0")) agm_date = agm_date[0];
    }

    if (typeof agm_date === "string") agm_date = agm_date.trim();

    if (!agm_date) {
      console.log("ERROR: agm_date missing in request body");
      return res.status(400).json({ error: "AGM date is required" });
    }

    // Validate date
    const parsedDate = new Date(agm_date);
    if (isNaN(parsedDate.getTime())) {
      console.log("ERROR: Invalid agm_date format:", agm_date);
      return res.status(400).json({ error: "Invalid agm_date format" });
    }
    // Store as a Date object (Sequelize DATE accepts JS Date)
    agm_date = parsedDate;

    // File checks
    console.log("=== FILE VALIDATION ===");
    console.log("req.files exists:", !!req.files);
    if (!req.files) {
      console.log("ERROR: No req.files found");
      return res
        .status(400)
        .json({ error: "No files uploaded - req.files is null/undefined" });
    }

    console.log("Available file fields:", Object.keys(req.files));

    // Agenda is required for AGM creation
    if (
      !req.files.agenda ||
      !Array.isArray(req.files.agenda) ||
      req.files.agenda.length === 0
    ) {
      console.log("ERROR: Agenda file validation failed", req.files.agenda);
      return res.status(400).json({ error: "Agenda file is required" });
    }

    // Notes file is optional
    if (
      req.files.notes &&
      (!Array.isArray(req.files.notes) || req.files.notes.length === 0)
    ) {
      console.log("WARN: notes field present but invalid:", req.files.notes);
    }

    const filePaths = {
      agenda: req.files.agenda[0].filename,
      notes: req.files && req.files.notes ? req.files.notes[0].filename : null,
    };

    console.log("File paths extracted:", filePaths);

    const newAGM = await AGM.create({
      agm_date,
      agenda: filePaths.agenda,
      notes: filePaths.notes,
    });

    // Return full created record
    const created = await AGM.findByPk(newAGM.id);
    console.log(
      "Created AGM:",
      created && created.toJSON ? created.toJSON() : created
    );
    res.status(201).json(created);
  } catch (error) {
    console.error("Error creating AGM:", error);
    res.status(400).json({ error: error.message });
  }
};

exports.getAGMs = async (req, res) => {
  try {
    const agms = await AGM.findAll();
    res.json(agms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAGMById = async (req, res) => {
  try {
    const agm = await AGM.findByPk(req.params.id);
    if (!agm) return res.status(404).json({ error: "AGM not found" });
    res.json(agm);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateAGM = async (req, res) => {
  try {
    if (req.user && req.user.usertypeid && req.user.usertypeid !== 1) {
      return res.status(403).json({ error: "Only admin can update AGM" });
    }

    const { id } = req.params;
    const { agm_date } = req.body;

    const agm = await AGM.findByPk(id);
    if (!agm) return res.status(404).json({ error: "AGM not found" });

    // Store old files for deletion if replaced
    const oldFiles = {
      agenda: agm.agenda,
      notes: agm.notes,
    };

    // Extract new uploaded file names
    const filePaths = {};
    if (req.files) {
      if (req.files.agenda) {
        filePaths.agenda = req.files.agenda[0].filename;
        if (oldFiles.agenda) deleteFileFromServer(oldFiles.agenda);
      }
      if (req.files.notes) {
        filePaths.notes = req.files.notes[0].filename;
        if (oldFiles.notes) deleteFileFromServer(oldFiles.notes);
      }
    }

    const updated = await agm.update({
      agm_date: agm_date || agm.agm_date,
      agenda: filePaths.agenda || agm.agenda,
      notes: filePaths.notes || agm.notes,
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating AGM:", error);
    res.status(400).json({ error: error.message });
  }
};

exports.deleteAGM = async (req, res) => {
  try {
    if (req.user && req.user.usertypeid && req.user.usertypeid !== 1) {
      return res.status(403).json({ error: "Only admin can delete AGM" });
    }

    const { id } = req.params;
    const agm = await AGM.findByPk(id);
    if (!agm) return res.status(404).json({ error: "AGM not found" });

    // Delete associated files
    if (agm.agenda) deleteFileFromServer(agm.agenda);
    if (agm.notes) deleteFileFromServer(agm.notes);

    await agm.destroy();
    res.json({ message: "AGM deleted" });
  } catch (error) {
    console.error("Error deleting AGM:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get AGMs as per member's institutes (like GCResolution logic)
exports.getAGMsByMember = async (req, res) => {
  try {
    const { usertypeid, id } = req.user;
    let agms = [];
    if (usertypeid === 1) {
      // Admin: all AGMs
      agms = await AGM.findAll();
    } else if (usertypeid === 3) {
      // Member: get all institutes where member has a role
      const member =
        await require("../resolution_backend/models").Member.findOne({
          where: { userid: id },
        });
      if (!member) return res.status(404).json({ error: "Member not found" });
      const memberRoles =
        await require("../resolution_backend/models").MemberRole.findAll({
          where: { member_id: member.id, status: "active" },
        });
      const instituteIds = [
        ...new Set(memberRoles.map((mr) => mr.institute_id)),
      ];
      agms = await AGM.findAll({ where: { institute_id: instituteIds } });
    } else {
      return res.status(403).json({ error: "Access denied" });
    }
    res.json(agms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Search PDF/text inside AGM files
exports.searchPDFContent = async (req, res) => {
  try {
    const { searchText, query } = req.query;
    const searchQuery = searchText || query;
    const { usertypeid, id } = req.user;

    if (!searchQuery || !searchQuery.trim()) {
      return res.json({ results: [] });
    }

    let agms = await AGM.findAll({ order: [["id", "DESC"]] });

    const searchTextLower = searchQuery.toLowerCase();
    const matchingAGMs = [];

    for (const agm of agms) {
      const pdfFields = ["agenda", "notes"];
      let foundMatch = false;
      for (const field of pdfFields) {
        if (agm[field] && !foundMatch) {
          try {
            const pdfPath = path.join(__dirname, "../uploads", agm[field]);
            if (fs.existsSync(pdfPath)) {
              const dataBuffer = fs.readFileSync(pdfPath);
              const pdfData = await pdf(dataBuffer);
              const pdfText = pdfData.text.toLowerCase();
              if (pdfText.includes(searchTextLower)) {
                matchingAGMs.push({
                  ...agm.toJSON(),
                  matchedField: field,
                });
                foundMatch = true;
                break;
              }
            }
          } catch (err) {
            console.error("Error reading AGM PDF", agm[field], err.message);
          }
        }
      }
    }

    res.json({
      results: matchingAGMs,
      searchText: searchQuery,
      totalFound: matchingAGMs.length,
    });
  } catch (err) {
    console.error("Error searching AGM PDF content:", err);
    res.status(500).json({ error: "Failed to search AGM PDF content" });
  }
};
