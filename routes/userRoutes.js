const express = require("express");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");

const router = express.Router();

// Users management dashboard (Admin only)
router.get(
  "/dashboard/users",
  authController.requireLogin,
  authController.requireRole("admin"),
  userController.renderUsersPage
);

// Get all users from ZKBioTime
router.get(
  "/api/users",
  authController.requireLogin,
  authController.requireRole("admin"),
  userController.getUsers
);

// Add new user to ZKBioTime
router.post(
  "/api/add-user",
  authController.requireLogin,
  authController.requireRole("admin"),
  userController.addUser
);

module.exports = router;
