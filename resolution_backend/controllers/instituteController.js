const { Institute, User } = require("../models");
const userController = require("./userController"); // Import userController

// Get all institutes
exports.getAllInstitutes = async (req, res) => {
  console.log("Entered getAllInstitutes");
  try {
    const institutes = await Institute.findAll({
      include: [{ model: User, attributes: [["username", "email"]] }],
      order: [["id", "ASC"]],
    });
    console.log(
      "This is the list of institutes:  ====================>",
      institutes
    );
    res.json(institutes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get institute by ID
exports.getInstituteById = async (req, res) => {
  try {
    const institute = await Institute.findByPk(req.params.id);
    if (!institute) {
      return res.status(404).json({ error: "Institute not found" });
    }
    res.json(institute);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create institute
exports.createInstitute = async (req, res) => {
  //console.log("Entered createInstitute");
  try {
    const { name, phone, code, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }
    // Do NOT include id, let PostgreSQL auto-generate it
    const institute = await Institute.create({ name, phone, code });
    req.body.username = email;
    req.body.password = "kls12345"; // default password
    req.body.usertypeid = 2;
    req.body.institute_id = institute.id; // Associate user with the newly created institute
    await userController.register(req, res);
    res.status(201).json(institute);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update institute
exports.updateInstitute = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const institute = await Institute.findByPk(req.params.id);
    if (!institute) {
      return res.status(404).json({ error: "Institute not found" });
    }
    institute.name = name || institute.name;
    institute.phone = phone || institute.phone;
    await institute.save();
    res.json(institute);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete institute
exports.deleteInstitute = async (req, res) => {
  try {
    const institute = await Institute.findByPk(req.params.id);
    if (!institute) {
      return res.status(404).json({ error: "Institute not found" });
    }
    await institute.destroy();
    res.json({ message: "Institute deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
