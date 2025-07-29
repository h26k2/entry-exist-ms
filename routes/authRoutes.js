const entryController = require("../controllers/entryController");
const express = require("express");
const authController = require("../controllers/authController");
const peopleController = require("../controllers/peopleController");
const reportController = require("../controllers/reportController");
const facilityController = require("../controllers/facilityController");

const router = express.Router();

// Card generation page (admin/operator)
router.get(
  "/card-generation",
  authController.requireLogin,
  entryController.renderCardGenerationPage
);
// Card generation API
router.post(
  "/api/generate-card",
  authController.requireLogin,
  entryController.generateCard
);

// Authentication routes
router.get("/", authController.renderLoginPage);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.post("/logout", authController.logout);
router.get("/dashboard", authController.requireLogin, authController.dashboard);

// Admin-only cache management routes
router.get(
  "/admin/cache/clear",
  authController.requireLogin,
  authController.requireRole("admin"),
  authController.clearCache
);
router.get(
  "/admin/cache/stats",
  authController.requireLogin,
  authController.requireRole("admin"),
  authController.getCacheStats
);

// Operator management routes
router.get(
  "/dashboard/operator",
  authController.requireLogin,
  authController.requireRole(["admin"]),
  authController.renderOperatorPage
);
router.post(
  "/dashboard/operator/add",
  authController.requireLogin,
  authController.requireRole(["admin"]),
  authController.addOperator
);
router.post(
  "/dashboard/operator/update/:id",
  authController.requireLogin,
  authController.requireRole(["admin"]),
  authController.updateOperator
);
router.post(
  "/dashboard/operator/delete",
  authController.requireLogin,
  authController.requireRole(["admin"]),
  authController.deleteOperators
);

// Entry management routes
router.get(
  "/dashboard/entry",
  authController.requireLogin,
  entryController.renderEntryPage
);
router.post(
  "/api/search-person",
  authController.requireLogin,
  entryController.searchPerson
);
router.post(
  "/api/search-person-inside",
  authController.requireLogin,
  entryController.searchPersonInside
);
router.post(
  "/api/register-person",
  authController.requireLogin,
  entryController.registerPerson
);
router.post(
  "/api/process-entry",
  authController.requireLogin,
  entryController.processEntry
);
router.post(
  "/api/process-exit",
  authController.requireLogin,
  entryController.processExit
);
router.get(
  "/api/current-occupancy",
  authController.requireApiAuth,
  entryController.getCurrentOccupancy
);
router.post(
  "/api/add-fee-deposit",
  authController.requireLogin,
  entryController.addFeeDeposit
);
router.get(
  "/api/person-deposits/:person_id",
  authController.requireLogin,
  entryController.getPersonDeposits
);
router.get(
  "/api/person/:id",
  authController.requireApiAuth,
  peopleController.getPersonDetails
);
// People management routes
router.get(
  "/dashboard/people",
  authController.requireLogin,
  peopleController.renderPeoplePage
);
router.post(
  "/api/search-people-advanced",
  authController.requireLogin,
  peopleController.searchPeople
);
router.post(
  "/api/add-person",
  authController.requireLogin,
  peopleController.addPerson
);
router.post(
  "/api/update-person/:id",
  authController.requireLogin,
  peopleController.updatePerson
);
router.delete(
  "/api/delete-person/:id",
  authController.requireLogin,
  peopleController.deletePerson
);
router.post(
  "/api/generate-card",
  authController.requireLogin,
  peopleController.generateCard
);
router.get(
  "/api/person-details/:id",
  authController.requireLogin,
  peopleController.getPersonDetails
);
router.post(
  "/api/add-family-member",
  authController.requireLogin,
  peopleController.addFamilyMember
);
router.get(
  "/api/people-by-category/:category_id",
  authController.requireLogin,
  peopleController.getPeopleByCategory
);
router.post(
  "/api/bulk-import-people",
  authController.requireLogin,
  peopleController.bulkImportPeople
);

// Categories API
router.get(
  "/api/categories",
  authController.requireApiAuth,
  async (req, res) => {
    try {
      const DatabaseHelper = require("../config/dbHelper");
      const categories = await DatabaseHelper.query(
        "SELECT * FROM categories ORDER BY name"
      );
      res.json({ success: true, categories });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res
        .status(500)
        .json({ success: false, message: "Error fetching categories" });
    }
  }
);

// People API for host person selection
router.get("/api/people", authController.requireApiAuth, async (req, res) => {
  try {
    const DatabaseHelper = require("../config/dbHelper");
    const people = await DatabaseHelper.query(`
      SELECT p.id, p.name, p.cnic, c.name as category 
      FROM people p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.name
    `);
    res.json({ success: true, people });
  } catch (error) {
    console.error("Error fetching people:", error);
    res.status(500).json({ success: false, message: "Error fetching people" });
  }
});

// People API for host person selection
router.get("/api/people", authController.requireLogin, async (req, res) => {
  try {
    const DatabaseHelper = require("../config/dbHelper");
    const people = await DatabaseHelper.query(`
      SELECT p.id, p.name, p.cnic, c.name as category 
      FROM people p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.name
    `);
    res.json({ success: true, people });
  } catch (error) {
    console.error("Error fetching people:", error);
    res.status(500).json({ success: false, message: "Error fetching people" });
  }
});

// Facility management routes (Admin only)
router.get(
  "/dashboard/facilities",
  authController.requireLogin,
  authController.requireRole("admin"),
  facilityController.renderFacilityPage
);
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
router.post(
  "/api/toggle-facility-status/:id",
  authController.requireLogin,
  authController.requireRole("admin"),
  facilityController.toggleFacilityStatus
);
router.get(
  "/api/facility-usage-report",
  authController.requireLogin,
  authController.requireRole("admin"),
  facilityController.getFacilityUsageReport
);

// Reports routes
router.get(
  "/dashboard/reports",
  authController.requireLogin,
  reportController.renderReportsPage
);
router.get(
  "/api/daily-summary",
  authController.requireLogin,
  reportController.getDailySummary
);
router.get(
  "/api/person-history",
  authController.requireLogin,
  reportController.getPersonHistory
);
router.get(
  "/api/category-report",
  authController.requireLogin,
  reportController.getCategoryReport
);
router.get(
  "/api/revenue-report",
  authController.requireLogin,
  reportController.getRevenueReport
);
router.get(
  "/api/export-data",
  authController.requireLogin,
  reportController.exportData
);

module.exports = router;
