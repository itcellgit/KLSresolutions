const { GCResolution } = require("../models");

// Get all GC resolutions (admin sees all, institute admin sees only their own)
exports.getAllGCResolutions = async (req, res) => {
  try {
    let resolutions;
    if (req.user.usertypeid === 1) { // admin
      resolutions = await GCResolution.findAll();
    } else if (req.user.usertypeid === 2) { // institute admin
      resolutions = await GCResolution.findAll({
        where: { institute_id: req.user.institute_id }
      });
    } else {
      return res.status(403).json({ error: "Access denied" });
    }
    res.json(resolutions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Institute admin can add GC resolution
exports.createGCResolution = async (req, res) => {
  try {
    if (req.user.usertypeid !== 2) {
      return res.status(403).json({ error: "Only institute admin can add GC resolutions" });
    }
    const { agenda, resolution, compliance, dom } = req.body;
    if (!agenda || !resolution || !dom) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const gcResolution = await GCResolution.create({
      agenda,
      resolution,
      compliance,
      dom,
      institute_id: req.user.institute_id
    });
    res.status(201).json(gcResolution);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
