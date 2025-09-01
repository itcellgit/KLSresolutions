const { Member, User } = require("../models");

exports.getAllMembers = async (req, res) => {
  try {
    const members = await Member.findAll({ include: User });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createMember = async (req, res) => {
  try {
    const member = await Member.create(req.body);
    res.status(201).json(member);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
