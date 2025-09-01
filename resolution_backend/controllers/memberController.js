
const { Member, User } = require("../models");

// Get all members (admin sees all, institute admin sees only their members)
exports.getAllMembers = async (req, res) => {
  try {
    let members;
    if (req.user.usertypeid === 1) { // admin
      members = await Member.findAll({ include: User });
    } else if (req.user.usertypeid === 2) { // institute admin
      members = await Member.findAll({
        include: [{ model: User, where: { institute_id: req.user.institute_id } }]
      });
    } else {
      return res.status(403).json({ error: "Access denied" });
    }
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin can add KLS board members and institute admins
// Institute admin can add institute members
exports.createMember = async (req, res) => {
  try {
    const bcrypt = require("bcrypt");
    const { name, phone, address, username, password, usertypeid, institute_id } = req.body;

    // Validate required fields
    if (!name || !phone || !username || !password || !usertypeid) {
      return res.status(400).json({ error: "Missing required fields (name, phone, username, password, usertypeid)" });
    }

    // Admin can create KLS board members (usertypeid: 1) and institute admins (usertypeid: 2)
    // Institute admin can create institute members (usertypeid: 3) for their own institute
    if (req.user.usertypeid === 1) {
      // Admin creating KLS board member or institute admin
      if (usertypeid === 1) {
        // KLS board member (no institute_id)
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, password: hashedPassword, usertypeid, institute_id: null });
        const member = await Member.create({ name, phone, address, userid: user.id });
        return res.status(201).json({ user, member });
      } else if (usertypeid === 2) {
        // Institute admin (must have institute_id)
        if (!institute_id) {
          return res.status(400).json({ error: "Institute admin must have institute_id" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, password: hashedPassword, usertypeid, institute_id });
        const member = await Member.create({ name, phone, address, userid: user.id });
        return res.status(201).json({ user, member });
      } else {
        return res.status(400).json({ error: "Admin can only create KLS board members (usertypeid: 1) or institute admins (usertypeid: 2)" });
      }
    } else if (req.user.usertypeid === 2) {
      // Institute admin creating institute member (usertypeid: 3)
      if (usertypeid !== 3) {
        return res.status(403).json({ error: "Institute admin can only create institute members (usertypeid: 3)" });
      }
      // Use institute_id from logged-in user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ username, password: hashedPassword, usertypeid, institute_id: req.user.institute_id });
      const member = await Member.create({ name, phone, address, userid: user.id });
      return res.status(201).json({ user, member });
    } else {
      return res.status(403).json({ error: "Access denied" });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
