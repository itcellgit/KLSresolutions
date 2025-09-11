// const { GCResolution, Member, MemberRole, Role } = require("../models");

// // Get all GC resolutions (admin sees all, institute admin sees only their own)
// exports.getAllGCResolutions = async (req, res) => {
//   try {
//     const { usertypeid, id } = req.user;
//     let resolutions = [];

//     if (usertypeid === 1) {
//       // Admin: all resolutions
//       resolutions = await GCResolution.findAll();
//     } else if (usertypeid === 3) {
//       // 1. Find member by userid
//       const member = await Member.findOne({ where: { userid: id } });
//       if (!member) {
//         return res.status(404).json({ error: "Member not found" });
//       }
//       // 2. Fetch active member roles with role details
//       const memberRoles = await MemberRole.findAll({
//         where: { member_id: member.id, status: "active" },
//         include: [
//           {
//             model: Role,
//             attributes: ["role_name"],
//           },
//         ],
//       });
//       // 3. Extract unique institute IDs (filter out null/undefined)
//       const instituteIds = [
//         ...new Set(
//           memberRoles
//             .map((mr) => mr.institute_id)
//             .filter((institute_id) => institute_id != null)
//         ),
//       ];
//       let resolutions;
//       console.log("Member roles found:", memberRoles);
//       console.log("Institute IDs associated with member:", instituteIds);
//       if (instituteIds.length > 0) {
//         // 4a. Fetch BOM resolutions for those institutes including GCResolution
//         resolutions = await BOMResolution.findAll({
//           where: { institute_id: instituteIds },
//           include: GCResolution,
//         });
//       } else {
//         console.log("No institute associations found for member.");
//         // 4b. No institute associations, check for special roles at BOM level
//         const specialRoles = memberRoles.filter((mr) => {
//           const roleName = mr.Role.role_name.toLowerCase();
//           const level = mr.level.toLowerCase();
//           return (
//             ["chairman", "vice president", "president"].includes(roleName) &&
//             level === "bom"
//           );
//         });
//         console.log("Special roles at BOM level:", specialRoles);
//         if (specialRoles.length > 0) {
//           // 5. Fetch all GCResolutions
//           resolutions = await GCResolution.findAll();
//         } else {
//           // 6. No special roles, return empty array
//           resolutions = [];
//         }
//       }
//       console.log("Resolutions found:", resolutions);
//       return res.json({ resolutions });
//     } else {
//       // Institute admin: only their institute's resolutions
//       resolutions = await GCResolution.findAll({
//         where: { institute_id: req.user.institute_id },
//       });
//       return res.json({ resolutions });
//     }
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

const {
  GCResolution,
  Member,
  MemberRole,
  Role,
  BOMResolution,
} = require("../models");

exports.getAllGCResolutions = async (req, res) => {
  try {
    const { usertypeid, id } = req.user;
    let resolutions = [];

    if (usertypeid === 1) {
      // Admin: all resolutions
      resolutions = await GCResolution.findAll();
    } else if (usertypeid === 3) {
      // 1. Find member by userid
      const member = await Member.findOne({ where: { userid: id } });
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      // 2. Fetch active member roles with role details
      // Fix: Use a different approach to avoid the association error
      const memberRoles = await MemberRole.findAll({
        where: { member_id: member.id, status: "active" },
      });

      // Get role IDs from memberRoles
      const roleIds = memberRoles.map((mr) => mr.role_id);

      // Fetch roles separately
      const roles = await Role.findAll({
        where: { id: roleIds },
        attributes: ["id", "role_name"],
      });

      // Create a role map for easy lookup
      const roleMap = {};
      roles.forEach((role) => {
        roleMap[role.id] = role.role_name;
      });

      // Combine memberRoles with role names
      const memberRolesWithRoles = memberRoles.map((mr) => ({
        ...mr.toJSON(),
        Role: { role_name: roleMap[mr.role_id] },
      }));

      // 3. Extract unique institute IDs (filter out null/undefined)
      const instituteIds = [
        ...new Set(
          memberRolesWithRoles
            .map((mr) => mr.institute_id)
            .filter((institute_id) => institute_id != null)
        ),
      ];

      let resolutions;
      console.log("Member roles found:", memberRolesWithRoles);
      console.log("Institute IDs associated with member:", instituteIds);

      if (instituteIds.length > 0) {
        // 4a. Fetch BOM resolutions for those institutes including GCResolution
        resolutions = await BOMResolution.findAll({
          where: { institute_id: instituteIds },
          include: [GCResolution], // Fix: Use array syntax for include
        });
      } else {
        console.log("No institute associations found for member.");
        // 4b. No institute associations, check for special roles at BOM level
        const specialRoles = memberRolesWithRoles.filter((mr) => {
          const roleName = mr.Role.role_name.toLowerCase();
          const level = mr.level.toLowerCase();
          return (
            ["chairman", "vice president", "president"].includes(roleName) &&
            level === "bom"
          );
        });
        console.log("Special roles at BOM level:", specialRoles);
        if (specialRoles.length > 0) {
          // 5. Fetch all GCResolutions
          resolutions = await GCResolution.findAll();
        } else {
          // 6. No special roles, return empty array
          resolutions = [];
        }
      }
      console.log("Resolutions found:", resolutions);
      return res.json({ resolutions });
    } else {
      // Institute admin: only their institute's resolutions
      resolutions = await GCResolution.findAll({
        where: { institute_id: req.user.institute_id },
      });
      return res.json({ resolutions });
    }
  } catch (err) {
    console.error("Error in getAllGCResolutions:", err);
    res.status(500).json({ error: err.message });
  }
};

// Institute admin can add GC resolution
exports.createGCResolution = async (req, res) => {
  try {
    if (req.user.usertypeid !== 2) {
      return res
        .status(403)
        .json({ error: "Only institute admin can add GC resolutions" });
    }
    const { agenda, resolution, compliance, dom } = req.body;
    if (!agenda || !resolution || !dom) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const gcResolution = await GCResolution.create({
      agenda,
      resolution,
      compliance,
      dom,
      institute_id: req.user.institute_id,
    });
    res.status(201).json(gcResolution);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
