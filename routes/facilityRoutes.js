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
router.get(
  "/api/facility-details/:id",
  authController.requireLogin,
  authController.requireRole("admin"),
  facilityController.getFacilityDetails
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
