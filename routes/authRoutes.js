const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

// Authentication routes
router.get("/", authController.renderLoginPage);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.post("/logout", authController.logout);
router.get("/dashboard", authController.requireLogin, authController.dashboard);

module.exports = router;
