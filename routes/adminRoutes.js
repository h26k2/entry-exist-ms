const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

// Cache management routes (Admin only)
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

// Operator management routes (Admin only)
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

module.exports = router;
