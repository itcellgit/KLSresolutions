const Role = require("../models/Role"); // Adjust path if needed

exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch roles" });
  }
};

exports.addRole = async (req, res) => {
  try {
    const { role_name } = req.body;
    if (!role_name)
      return res.status(400).json({ error: "Role name required" });
    const role = new Role({ role_name });
    await role.save();
    res.status(201).json(role);
  } catch (err) {
    res.status(500).json({ error: "Failed to add role" });
  }
};

exports.editRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_name } = req.body;
    const role = await Role.findByIdAndUpdate(id, { role_name }, { new: true });
    if (!role) return res.status(404).json({ error: "Role not found" });
    res.json(role);
  } catch (err) {
    res.status(500).json({ error: "Failed to update role" });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findByIdAndDelete(id);
    if (!role) return res.status(404).json({ error: "Role not found" });
    res.json({ message: "Role deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete role" });
  }
};
