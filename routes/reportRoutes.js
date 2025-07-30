const express = require("express");
const authController = require("../controllers/authController");
const reportController = require("../controllers/reportController");

const router = express.Router();

// Reports dashboard
router.get(
  "/dashboard/reports",
  authController.requireLogin,
  reportController.renderReportsPage
);

// Report APIs
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

// Data export
router.get(
  "/api/export-data",
  authController.requireLogin,
  reportController.exportData
);

module.exports = router;
