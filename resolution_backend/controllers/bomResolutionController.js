const { BOMResolution, GCResolution } = require("../models");

// Admin can see all BOM resolutions, prepare BOM agenda
exports.getAllBOMResolutions = async (req, res) => {
  try {
    const { usertypeid, id } = req.user;
    let resolutions = [];
    if (usertypeid === 1) {
      // Admin: all BOM resolutions
      resolutions = await BOMResolution.findAll({ include: GCResolution });
    } else if (usertypeid === 3) {
      // Member: get all institutes where member has a role
      const { Member, MemberRole } = require("../models");
      const member = await Member.findOne({ where: { userid: id } });
      if (!member) return res.status(404).json({ error: "Member not found" });
      const memberRoles = await MemberRole.findAll({ where: { member_id: member.id, status: 'active' } });
      const instituteIds = [...new Set(memberRoles.map(mr => mr.institute_id))];
      resolutions = await BOMResolution.findAll({ where: { institute_id: instituteIds }, include: GCResolution });
    } else {
      return res.status(403).json({ error: "Access denied" });
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
