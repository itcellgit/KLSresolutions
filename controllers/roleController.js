// controllers/roleController.js
const { Role } = require("../models"); // Adjust the path as necessary
// GET all roles
exports.getRoles = async (req, res) => {
  try {
    // Sequelize uses findAll() instead of find()
    const roles = await Role.findAll();
    res.json(roles);
  } catch (err) {
    console.error("Error fetching roles:", err);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
};

// POST a new role
exports.addRole = async (req, res) => {
  try {
    const { role_name } = req.body;
    if (!role_name) {
      return res.status(400).json({ error: "Role name required" });
    }
    // Sequelize uses create() instead of new Model() and save()
    const role = await Role.create({ role_name });
    res.status(201).json(role);
  } catch (err) {
    console.error("Error adding role:", err);
    res.status(500).json({ error: "Failed to add role" });
  }
};

// PUT (update) a role
exports.editRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_name } = req.body;

    // Sequelize uses update() to update a record
    // It returns an array where the first element is the number of affected rows
    const [updatedRowCount] = await Role.update(
      { role_name },
      { where: { id: id } }
    );

    if (updatedRowCount === 0) {
      return res.status(404).json({ error: "Role not found" });
    }

    // Fetch the updated record to return it
    const updatedRole = await Role.findByPk(id);
    res.json(updatedRole);
  } catch (err) {
    console.error("Error updating role:", err);
    res.status(500).json({ error: "Failed to update role" });
  }
};

// DELETE a role
exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    // Sequelize uses destroy() with a where clause
    const deletedRowCount = await Role.destroy({
      where: { id: id },
    });

    if (deletedRowCount === 0) {
      return res.status(404).json({ error: "Role not found" });
    }

    res.json({ message: "Role deleted" });
  } catch (err) {
    console.error("Error deleting role:", err);
    res.status(500).json({ error: "Failed to delete role" });
  }
};
