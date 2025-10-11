// Add these routes to your existing routes file

const {
  getAllGCResolutions,
  createGCResolution,
  updateGCResolution,
  deleteGCResolution,
  searchPDFContent,
  // Add the new controller functions
  getGCResolutionsByMemberAndTenure,
  getGCResolutionsByMemberTenureAndInstitute,
  getMemberAccessibleInstitutes,
} = require("../controllers/gcResolutionController");

// ... your existing routes ...

/**
 * New member-based routes
 */
// GET /api/gc-resolutions/member/:memberId/tenure/:tenureId
router.get(
  "/member/:memberId/tenure/:tenureId",
  authenticateToken,
  getGCResolutionsByMemberAndTenure
);

// GET /api/gc-resolutions/member/:memberId/tenure/:tenureId/institute/:instituteId
router.get(
  "/member/:memberId/tenure/:tenureId/institute/:instituteId",
  authenticateToken,
  getGCResolutionsByMemberTenureAndInstitute
);

// GET /api/gc-resolutions/member/:memberId/tenure/:tenureId/institutes
router.get(
  "/member/:memberId/tenure/:tenureId/institutes",
  authenticateToken,
  getMemberAccessibleInstitutes
);
