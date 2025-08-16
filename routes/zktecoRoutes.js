const express = require("express");
const router = express.Router();
const zktecoController = require("../controllers/zktecoController");

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/auth/login");
  }
};

// Middleware to check if user is admin (for sensitive operations)
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ success: false, message: "Admin access required" });
  }
};

// Render ZKTeco integration page
router.get("/", isAuthenticated, zktecoController.renderZKTecoPage);

// Test ZKTeco connection
router.post(
  "/test-connection",
  isAuthenticated,
  zktecoController.testConnection
);

// Sync operations (admin only)
router.post("/sync-all-people", isAdmin, zktecoController.syncAllPeople);
router.post("/sync-person", isAdmin, zktecoController.syncPerson);
router.post(
  "/sync-unsynced-entries",
  isAdmin,
  zktecoController.syncUnsyncedEntries
);

// Pull attendance from ZKTeco
router.post(
  "/pull-attendance",
  isAuthenticated,
  zktecoController.pullAttendance
);

// Manual sync operations
router.post(
  "/manual-entry-sync",
  isAuthenticated,
  zktecoController.manualEntrySync
);

// Get data from ZKTeco
router.get("/employees", isAuthenticated, zktecoController.getZKTecoEmployees);
router.get(
  "/transactions",
  isAuthenticated,
  zktecoController.getZKTecoTransactions
);

// Get sync status
router.get("/sync-status", isAuthenticated, zktecoController.getSyncStatus);

module.exports = router;
