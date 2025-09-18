const { BOMResolution, GCResolution } = require("../models");

// Dedicated method to generate BOM No
async function generateBOMNo(bom_date) {
  // Find all BOM resolutions for this date
  const sameDateResolutions = await BOMResolution.findAll({
    where: { bom_date },
    order: [["id", "ASC"]],
  });

  // Meeting number: If there are previous meetings on this date, use their meeting number, else increment
  let meetingNo = 1;
  if (sameDateResolutions.length > 0) {
    // Extract meeting number from first resolution's bom_no
    const firstResolution = sameDateResolutions[0];
    const match =
      firstResolution.bom_no && firstResolution.bom_no.match(/^bom_(\d+)_\d+$/);
    meetingNo = match ? parseInt(match[1], 10) : 1;
  } else {
    // Find max meeting number so far
    const allResolutions = await BOMResolution.findAll({
      order: [["id", "ASC"]],
    });
    const meetingNos = allResolutions
      .map((r) => {
        const m = r.bom_no && r.bom_no.match(/^bom_(\d+)_\d+$/);
        return m ? parseInt(m[1], 10) : null;
      })
      .filter((n) => n !== null);
    meetingNo = meetingNos.length > 0 ? Math.max(...meetingNos) + 1 : 1;
  }

  // Agenda point number (series): next in sequence for this date
  const seriesNo = sameDateResolutions.length + 1;

  // Format: bom_meetingNo_seriesNo
  return `bom_${meetingNo}_${seriesNo}`;
}

// Admin can see all BOM resolutions, prepare BOM agenda
exports.getAllBOMResolutions = async (req, res) => {
  try {
    const { usertypeid, id } = req.user;
    let resolutions = [];
    if (usertypeid === 1 || usertypeid === 3) {
      // Admin and all members get all BOM resolutions, ordered by id DESC (latest first)
      resolutions = await BOMResolution.findAll({
        include: GCResolution,
        order: [["id", "DESC"]],
      });
    } else if (usertypeid === 2) {
      // Institute admin: fetch BOM resolutions related to GC resolutions of their institute
      const instituteId = req.user.institute_id;
      // Find all GC resolutions for this institute
      const gcResolutions = await GCResolution.findAll({
        where: { institute_id: instituteId },
        attributes: ["id"],
      });
      const gcResolutionIds = gcResolutions.map((gc) => gc.id);

      // Fetch BOM resolutions where gc_resolution_id is in the above list
      resolutions = await BOMResolution.findAll({
        where: { gc_resolution_id: gcResolutionIds },
        include: GCResolution,
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
  try {
    if (req.user.usertypeid !== 1) {
      return res
        .status(403)
        .json({ error: "Only admin can create BOM agenda" });
    }
    const { agenda, resolution, compliance, gc_resolution_id, bom_date } =
      req.body;

    if (!agenda || !resolution || !gc_resolution_id || !bom_date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Generate BOM No
    const bom_no = await generateBOMNo(bom_date);

    const bomResolution = await BOMResolution.create({
      agenda,
      resolution,
      compliance,
      gc_resolution_id,
      bom_date,
      bom_no,
    });
    res.status(201).json(bomResolution);
  } catch (err) {
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
    await bomResolution.destroy();
    res.json({ message: "BOM Resolution deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Admin can update BOM resolution
exports.updateBOMResolution = async (req, res) => {
  try {
    if (req.user.usertypeid !== 1) {
      return res
        .status(403)
        .json({ error: "Only admin can update BOM resolution" });
    }
    const { id } = req.params;
    const { agenda, resolution, compliance, gc_resolution_id, bom_date } =
      req.body;

    const bomResolution = await BOMResolution.findByPk(id);
    if (!bomResolution) {
      return res.status(404).json({ error: "BOM Resolution not found" });
    }
    // If bom_date is changed, regenerate bom_no
    let bom_no = bomResolution.bom_no;
    if (bom_date && bom_date !== bomResolution.bom_date) {
      bom_no = await generateBOMNo(bom_date);
    }
    await bomResolution.update({
      agenda: agenda || bomResolution.agenda,
      resolution: resolution || bomResolution.resolution,
      compliance: compliance || bomResolution.compliance,
      gc_resolution_id: gc_resolution_id || bomResolution.gc_resolution_id,
      bom_date: bom_date || bomResolution.bom_date,
      bom_no,
    });
    res.json(bomResolution);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
