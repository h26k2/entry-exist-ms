const bcrypt = require('bcrypt');
const db = require('../config/db');

exports.renderLoginPage = (req, res) => {
  res.render('login');
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.render('login', { error: 'DB error' });
    if (results.length === 0) return res.render('login', { error: 'User not found' });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (match) {
      req.session.user = {
        id: user.id,
        role: user.role,
        email: user.email
      };
      res.redirect('/dashboard');
    } else {
      res.render('login', { error: 'Invalid password' });
    }
  });
};

exports.requireLogin = (req, res, next) => {
  if (!req.session.user) return res.redirect('/');
  next();
};

exports.dashboard = (req, res) => {
  res.render('dashboard', { user: req.session.user });
};
