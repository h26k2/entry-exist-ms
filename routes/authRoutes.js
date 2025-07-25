const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/', authController.renderLoginPage);
router.post('/login', authController.login);
router.get('/dashboard', authController.requireLogin, authController.dashboard);
router.get('/dashboard/operator', authController.requireLogin, authController.renderOperatorPage);


router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});


module.exports = router;
