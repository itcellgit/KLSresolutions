const { AGM } = require("../models");

exports.createAGM = async (req, res) => {
  try {
    const agm = await AGM.create(req.body);
    res.status(201).json(agm);
  } catch (error) {
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
    const [updated] = await AGM.update(req.body, {
      where: { id: req.params.id },
    });
    if (!updated) return res.status(404).json({ error: "AGM not found" });
    const agm = await AGM.findByPk(req.params.id);
    res.json(agm);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteAGM = async (req, res) => {
  try {
    const deleted = await AGM.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: "AGM not found" });
    res.json({ message: "AGM deleted" });
  } catch (error) {
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
