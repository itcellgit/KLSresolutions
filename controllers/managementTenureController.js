const { ManagementTenure } = require("../models");

// Get all management tenures
exports.getAllManagementTenures = async (req, res) => {
  try {
    const tenures = await ManagementTenure.findAll({
      order: [["start_date", "DESC"]],
    });
    console.log("Fetched management tenures:", tenures);
    res.json(tenures);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single management tenure by id
exports.getManagementTenureById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenure = await ManagementTenure.findByPk(id);
    if (!tenure) {
      return res.status(404).json({ error: "Management tenure not found" });
    }
    res.json(tenure);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new management tenure
exports.createManagementTenure = async (req, res) => {
  try {
    const { tenure, start_date } = req.body;

    // Validate required fields
    if (!tenure || !start_date) {
      return res.status(400).json({
        error: "tenure and start_date are required",
      });
    }

    const newTenure = await ManagementTenure.create({
      tenure,
      start_date,
    });

    res.status(201).json(newTenure);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a management tenure
exports.updateManagementTenure = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenure, start_date } = req.body;

    const existingTenure = await ManagementTenure.findByPk(id);
    if (!existingTenure) {
      return res.status(404).json({ error: "Management tenure not found" });
    }

    const updatedTenure = await existingTenure.update({
      tenure: tenure || existingTenure.tenure,
      start_date: start_date || existingTenure.start_date,
      updated_at: new Date(),
    });

    res.json(updatedTenure);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a management tenure
exports.deleteManagementTenure = async (req, res) => {
  try {
    const { id } = req.params;

    const tenure = await ManagementTenure.findByPk(id);
    if (!tenure) {
      return res.status(404).json({ error: "Management tenure not found" });
    }

    // Check if tenure is referenced by any member roles
    const { MemberRole } = require("../models");
    const referencedRoles = await MemberRole.findAll({
      where: { tenure_id: id },
    });

    if (referencedRoles.length > 0) {
      return res.status(400).json({
        error: "Cannot delete tenure that is referenced by member roles",
        referenced_roles_count: referencedRoles.length,
      });
    }

    await tenure.destroy();
    res.json({ message: "Management tenure deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
