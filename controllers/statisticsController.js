// controllers/statisticsController.js
const db = require("../models");

// Example: Fetch total users, total members, total resolutions, etc.
exports.getStatistics = async (req, res) => {
  try {
    // Fetch from respective
    // Use correct model names as per your models/index.js exports
    const totalInstitutes = await db.Institute.count();
    const totalMembers = await db.Member.count();
    const totalGCResolutions = await db.GCResolution.count();
    const totalBOMResolutions = await db.BOMResolution.count();

    // Fetch recent resolutions (last 5 from each, with institute info)
    const recentGC = await db.GCResolution.findAll({
      limit: 5,
      order: [["gc_date", "DESC"]],
      include: [{ model: db.Institute, attributes: ["name"] }],
    });
    const recentBOM = await db.BOMResolution.findAll({
      limit: 5,
      order: [["bom_date", "DESC"]],
      include: [
        {
          model: db.GCResolution,
          include: [{ model: db.Institute, attributes: ["name"] }],
        },
      ],
    });

    // Normalize recent resolutions for frontend
    const recentResolutions = [
      ...recentGC.map((r) => ({
        id: r.id,
        title: r.agenda || r.title || r.subject || "GC Resolution",
        type: "GC",
        institute: r.Institute ? r.Institute.name : "",
        date: r.gc_date,
      })),
      ...recentBOM.map((r) => ({
        id: r.id,
        title: r.agenda || r.title || r.subject || "BOM Resolution",
        type: "BOM",
        institute:
          r.GCResolution && r.GCResolution.Institute
            ? r.GCResolution.Institute.name
            : "",
        date: r.bom_date,
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    res.json({
      totalInstitutes,
      totalMembers,
      totalGCResolutions,
      totalBOMResolutions,
      recentResolutions,
    });
  } catch (error) {
    console.error("Failed to fetch statistics:", error);
    // Log available models for debugging
    console.error("Available models:", Object.keys(db));
    res.status(500).json({
      error: "Failed to fetch statistics",
    });
  }
};
