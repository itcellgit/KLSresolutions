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
  console.log("Entered createInstitute");
  try {
    const { name, phone, code, email } = req.body;
    console.log("Request body:", req.body);
    console.log("Phone value:", phone, "Type:", typeof phone);

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    // Prepare institute data - handle empty phone field
    const instituteData = {
      name,
      code,
    };

    // Only add phone if it's a valid number or can be converted to one
    if (phone && phone !== "" && !isNaN(phone)) {
      instituteData.phone = parseInt(phone);
      console.log("Adding phone to institute:", instituteData.phone);
    } else {
      console.log("Phone is empty or invalid, skipping phone field");
    }

    console.log("Institute data to create:", instituteData);

    // Do NOT include id, let PostgreSQL auto-generate it
    const institute = await Institute.create(instituteData);
    console.log("Created institute:", institute);
    console.log("Institute ID:", institute.id);
    console.log("Institute ID type:", typeof institute.id);

    // Validate that institute.id exists and is a valid number
    if (!institute.id || typeof institute.id !== "number") {
      console.error("Institute ID is invalid:", institute.id);
      return res
        .status(500)
        .json({ error: "Failed to create institute - invalid ID generated" });
    }

    // Create a new req object for user registration to avoid mutation issues
    const userReq = {
      body: {
        username: email,
        password: "kls12345", // default password
        usertypeid: 2,
        institute_id: institute.id,
      },
    };

    console.log("User registration request body:", userReq.body);
    console.log("institute_id being passed:", userReq.body.institute_id);

    // Create a mock response object that captures the user creation result
    const userRes = {
      status: (code) => ({
        json: (data) => {
          if (code === 201) {
            console.log("User created successfully:", data);
            return res.status(201).json(institute);
          } else {
            console.error("User creation failed:", data);
            return res.status(code).json(data);
          }
        },
      }),
      json: (data) => {
        console.error("User creation error:", data);
        return res.status(400).json(data);
      },
    };

    await userController.register(userReq, userRes);
  } catch (err) {
    console.error("Error in createInstitute:", err);
    res.status(400).json({ error: err.message });
  }
};

// Update institute
exports.updateInstitute = async (req, res) => {
  try {
    const { name, phone, code } = req.body;
    const institute = await Institute.findByPk(req.params.id);
    if (!institute) {
      return res.status(404).json({ error: "Institute not found" });
    }
    institute.name = name || institute.name;
    institute.phone = phone || institute.phone;
    institute.code = code || institute.code;
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
