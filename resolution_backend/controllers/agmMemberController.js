const { AGM, Member, MemberRole } = require("../models");

// Get all AGMs (admin sees all, member sees for their institutes, etc.)
exports.getAllAGMs = async (req, res) => {
  try {
    const { usertypeid, id } = req.user;
    let agms = [];
    if (usertypeid === 1) {
      // Admin: all AGMs
      agms = await AGM.findAll();
    } else if (usertypeid === 3) {
      // Member: get all institutes where member has a role
      const member = await Member.findOne({ where: { userid: id } });
      if (!member) return res.status(404).json({ error: "Member not found" });
      const memberRoles = await MemberRole.findAll({ where: { member_id: member.id, status: 'active' } });
      const instituteIds = [...new Set(memberRoles.map(mr => mr.institute_id))];
      agms = await AGM.findAll({ where: { institute_id: instituteIds } });
    } else {
      return res.status(403).json({ error: "Access denied" });
    }
    res.json(agms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
