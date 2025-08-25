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
  authController.requireApiAuth,
  authController.requireRole("admin"),
  userController.getUsers
);

// Add new user to ZKBioTime
router.post(
  "/api/add-user",
  authController.requireApiAuth,
  authController.requireRole("admin"),
  userController.addUser
);

// Register user in app_users table
router.post(
  "/api/register-app-user",
  authController.requireApiAuth,
  authController.requireRole("admin"),
  userController.registerAppUser
);

// Get user details from app_users table
router.get(
  "/api/user-details/:emp_code",
  authController.requireApiAuth,
  authController.requireRole("admin"),
  userController.getUserDetails
);

// Update user in app_users table
router.put(
  "/api/update-app-user/:emp_code",
  authController.requireApiAuth,
  authController.requireRole("admin"),
  userController.updateAppUser
);

module.exports = router;
