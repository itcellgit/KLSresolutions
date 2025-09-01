const { BOMResolution, GCResolution } = require("../models");

// Admin can see all BOM resolutions, prepare BOM agenda
exports.getAllBOMResolutions = async (req, res) => {
  try {
    if (req.user.usertypeid !== 1) {
      return res.status(403).json({ error: "Only admin can view BOM resolutions" });
    }
    const resolutions = await BOMResolution.findAll({ include: GCResolution });
    res.json(resolutions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin can create BOM agenda
exports.createBOMResolution = async (req, res) => {
  try {
    if (req.user.usertypeid !== 1) {
      return res.status(403).json({ error: "Only admin can create BOM agenda" });
    }
    const { agenda, resolution, compliance, gc_resolution_id, dom } = req.body;
    if (!agenda || !resolution || !gc_resolution_id || !dom) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const bomResolution = await BOMResolution.create({
      agenda,
      resolution,
      compliance,
      gc_resolution_id,
      dom
    });
    res.status(201).json(bomResolution);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
