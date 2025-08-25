const express = require("express");
const authController = require("../controllers/authController");
const facilityController = require("../controllers/facilityController");

const router = express.Router();

// Facility management dashboard (Admin only)
router.get(
  "/dashboard/facilities",
  authController.requireLogin,
  authController.requireRole("admin"),
  facilityController.renderFacilityPage
);

// Facility stats API (for frontend dashboard)
router.get(
  "/api/facilities/stats",
  authController.requireLogin,
  authController.requireRole("admin"),
  facilityController.getFacilityStats
);

// Facility CRUD operations (Admin only)
router.post(
  "/api/add-facility",
  authController.requireLogin,
  authController.requireRole("admin"),
  facilityController.addFacility
);
router.post(
  "/api/update-facility/:id",
  authController.requireLogin,
  authController.requireRole("admin"),
  facilityController.updateFacility
);
router.delete(
  "/api/delete-facility/:id",
  authController.requireLogin,
  authController.requireRole("admin"),
  facilityController.deleteFacility
);

// Facility management
router.post(
  "/api/toggle-facility-status/:id",
  authController.requireLogin,
  authController.requireRole("admin"),
  facilityController.toggleFacilityStatus
);

// Facility reports
router.get(
  "/api/facility-usage-report",
  authController.requireLogin,
  authController.requireRole("admin"),
  facilityController.getFacilityUsageReport
);

module.exports = router;
