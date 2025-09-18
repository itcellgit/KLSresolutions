const {
  GCResolution,
  Member,
  MemberRole,
  Role,
  BOMResolution,
  Institute,
} = require("../models");

// Dedicated method to generate GC No
async function generateGCNo(institute_id, gc_date) {
  // Fetch institute short name
  const institute = await Institute.findByPk(institute_id);
  if (!institute || !institute.code) {
    throw new Error("Institute short name not found");
  }
  const code = institute.code;

  // Find all GC resolutions for this institute and date
  const sameDateResolutions = await GCResolution.findAll({
    where: {
      institute_id,
      gc_date,
    },
    order: [["id", "ASC"]],
  });

  // Determine the series number (next in sequence)
  const seriesNo = sameDateResolutions.length + 1;

  // Find the group number for this date (lowest id for this date)
  let groupNo = 1;
  if (sameDateResolutions.length > 0) {
    // Find the minimum group number for this date
    const firstResolution = sameDateResolutions[0];
    // Extract group number from existing gc_no (e.g., KLSGIT_1_1)
    const match = firstResolution.gc_no.match(/^[A-Za-z0-9]+_(\d+)_\d+$/);
    groupNo = match ? parseInt(match[1], 10) : 1;
  } else {
    // Find max group number for this institute
    const allResolutions = await GCResolution.findAll({
      where: { institute_id },
      order: [["id", "ASC"]],
    });
    const groupNos = allResolutions
      .map((r) => {
        const m = r.gc_no && r.gc_no.match(/^[A-Za-z0-9]+_(\d+)_\d+$/);
        return m ? parseInt(m[1], 10) : null;
      })
      .filter((n) => n !== null);
    groupNo = groupNos.length > 0 ? Math.max(...groupNos) + 1 : 1;
  }

  // Format: code_groupNo_seriesNo
  return `${code}_${groupNo}_${seriesNo}`;
}

// Get all GC resolutions (admin sees all, institute admin sees only their own)
// exports.getAllGCResolutions = async (req, res) => {
//   try {
//     const { usertypeid, id } = req.user;
//     let resolutions = [];

//     if (usertypeid === 1) {
//       // Admin: all resolutions, latest first
//       resolutions = await GCResolution.findAll({
//         order: [["id", "DESC"]],
//       });
//     } else if (usertypeid === 2) {
//       // Institute admin: only their institute's resolutions, latest first
//       resolutions = await GCResolution.findAll({
//         where: { institute_id: req.user.institute_id },
//         order: [["id", "DESC"]],
//       });
//     } else if (usertypeid === 3) {
//       // Member: fetch only resolutions for institutes from member_role
//       const member = await Member.findOne({ where: { userid: id } });
//       if (!member) {
//         return res.status(404).json({ error: "Member not found" });
//       }
//       // Fetch active member roles with institute_id
//       const memberRoles = await MemberRole.findAll({
//         where: { member_id: member.id, status: "active" },
//       });
//       const instituteIds = [
//         ...new Set(
//           memberRoles
//             .map((mr) => mr.institute_id)
//             .filter((institute_id) => institute_id != null)
//         ),
//       ];
//       if (instituteIds.length === 0) {
//         return res
//           .status(400)
//           .json({ error: "Member does not belong to any institute" });
//       }
//       resolutions = await GCResolution.findAll({
//         where: { institute_id: instituteIds },
//         order: [["id", "DESC"]],
//       });
//     }

//     return res.json({ resolutions });
//   } catch (err) {
//     console.error("Error in getAllGCResolutions:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

//condition addeed
exports.getAllGCResolutions = async (req, res) => {
  try {
    const { usertypeid, id } = req.user;
    let resolutions = [];

    if (usertypeid === 1) {
      // Admin: all resolutions, latest first
      resolutions = await GCResolution.findAll({
        order: [["id", "DESC"]],
      });
    } else if (usertypeid === 2) {
      // Institute admin: only their institute's resolutions, latest first
      resolutions = await GCResolution.findAll({
        where: { institute_id: req.user.institute_id },
        order: [["id", "DESC"]],
      });
    } else if (usertypeid === 3) {
      // Member: check if President or Vice President, else restrict to their institutes
      const member = await Member.findOne({ where: { userid: id } });
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }
      // Fetch active member roles with institute_id and include role
      const memberRoles = await MemberRole.findAll({
        where: { member_id: member.id, status: "active" },
        include: [{ model: Role, as: "role" }],
      });
      // Check if any role is President or Vice President
      const hasSpecialRole = memberRoles.some(
        (mr) =>
          mr.role &&
          (mr.role.role_name === "President" ||
            mr.role.role_name === "Vice President")
      );
      if (hasSpecialRole) {
        // President or Vice President: view all resolutions
        resolutions = await GCResolution.findAll({
          order: [["id", "DESC"]],
        });
      } else {
        // Regular member: only their institutes
        const instituteIds = [
          ...new Set(
            memberRoles
              .map((mr) => mr.institute_id)
              .filter((institute_id) => institute_id != null)
          ),
        ];
        if (instituteIds.length === 0) {
          return res
            .status(400)
            .json({ error: "Member does not belong to any institute" });
        }
        resolutions = await GCResolution.findAll({
          where: { institute_id: instituteIds },
          order: [["id", "DESC"]],
        });
      }
    }

    return res.json({ resolutions });
  } catch (err) {
    console.error("Error in getAllGCResolutions:", err);
    res.status(500).json({ error: err.message });
  }
};

// Institute admin can add GC resolution
exports.createGCResolution = async (req, res) => {
  console.log("Request body:", req.body);
  try {
    if (req.user.usertypeid !== 2) {
      return res
        .status(403)
        .json({ error: "Only institute admin can add GC resolutions" });
    }
    const { agenda, resolution, compliance, gc_date } = req.body;
    if (!agenda || !resolution || !gc_date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Generate GC No
    const gc_no = await generateGCNo(req.user.institute_id, gc_date);

    const gcResolution = await GCResolution.create({
      agenda,
      resolution,
      compliance,
      gc_date,
      gc_no,
      institute_id: req.user.institute_id,
    });

    res.status(201).json(gcResolution);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update a GC resolution
exports.updateGCResolution = async (req, res) => {
  try {
    const { id } = req.params;
    const { agenda, resolution, compliance, gc_date } = req.body;

    const gcResolution = await GCResolution.findByPk(id);
    if (!gcResolution) {
      return res.status(404).json({ error: "Resolution not found" });
    }

    // Check if the user has permission to update this resolution
    if (
      req.user.usertypeid === 2 &&
      gcResolution.institute_id !== req.user.institute_id
    ) {
      return res
        .status(403)
        .json({ error: "You can only update resolutions of your institute" });
    }

    await gcResolution.update({
      agenda,
      resolution,
      compliance,
      gc_date,
    });

    res.json(gcResolution);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a GC resolution
exports.deleteGCResolution = async (req, res) => {
  try {
    const { id } = req.params;

    const gcResolution = await GCResolution.findByPk(id);
    if (!gcResolution) {
      return res.status(404).json({ error: "Resolution not found" });
    }

    // Check if the user has permission to delete this resolution
    if (
      req.user.usertypeid === 2 &&
      gcResolution.institute_id !== req.user.institute_id
    ) {
      return res
        .status(403)
        .json({ error: "You can only delete resolutions of your institute" });
    }

    await gcResolution.destroy();

    res.json({ message: "Resolution deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
