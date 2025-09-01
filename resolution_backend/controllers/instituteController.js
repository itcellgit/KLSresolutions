const { Institute } = require("../models");

// Get all institutes
exports.getAllInstitutes = async (req, res) => {
	try {
		const institutes = await Institute.findAll();
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
	try {
		const { name, phone } = req.body;
		if (!name) {
			return res.status(400).json({ error: "Name is required" });
		}
		const institute = await Institute.create({ name, phone });
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
