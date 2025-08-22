const express = require('express');
const { renderDevicesPage } = require('../controllers/deviceController');
const authController = require("../controllers/authController");

const router = express.Router();

// Device management page
router.get('/dashboard/devices', authController.requireLogin, renderDevicesPage);

module.exports = router;
