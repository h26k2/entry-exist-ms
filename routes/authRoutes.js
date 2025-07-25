const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/', authController.renderLoginPage);
router.post('/login', authController.login);
router.get('/dashboard', authController.requireLogin, authController.dashboard);

module.exports = router;
