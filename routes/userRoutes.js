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

// Get facilities for assignment
router.get(
  "/api/facilities-for-assignment",
  authController.requireApiAuth,
  authController.requireRole("admin"),
  userController.getFacilitiesForAssignment
);

// Check if user has assigned facilities
router.get(
  "/api/user-facilities-check/:emp_code",
  authController.requireApiAuth,
  authController.requireRole("admin"),
  userController.checkUserFacilities
);

// Get user's assigned facilities
router.get(
  "/api/user-facilities/:emp_code",
  authController.requireApiAuth,
  authController.requireRole("admin"),
  userController.getUserFacilities
);

// Save user facilities assignment
router.post(
  "/api/save-user-facilities/:emp_code",
  authController.requireApiAuth,
  authController.requireRole("admin"),
  userController.saveFacilitiesAssignment
);

// Mark user as paid
router.post(
  "/api/mark-user-paid/:emp_code",
  authController.requireApiAuth,
  authController.requireRole("admin"),
  userController.markUserAsPaid
);

module.exports = router;
