const bcrypt = require('bcrypt');
const db = require('../config/db');

exports.renderLoginPage = (req, res) => {

    if (req.session.user) {
        return res.redirect('/dashboard');
    }

  res.render('login', { error: null });
};

exports.login = async(req, res) => {
  const { number, password } = req.body; 
  const cnic = number.replace(/\D/g, ''); 


  try{
        const [results] = await db.query('SELECT * FROM users WHERE cnic_num = ?', [cnic]);

        if (results.length === 0) {
        
        return res.render('login', { error: 'User not found' });
        }

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);

        if (match) {
        
            req.session.user = {
                cnic_num: user.cnic_num,
                role: user.role
            };
            res.redirect('/dashboard');
        } 
        else {
            res.render('login', { error: 'Invalid password' });
        }
    }
    catch (err) {
        console.error(err);
        res.render('login', { error: 'Database error' });
    }


};

exports.requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  next();
};

exports.dashboard = (req, res) => {
  res.render('dashboard', { user: req.session.user, activePage: 'dashboard',title : 'Dashboard' });
};

exports.renderOperatorPage = (req, res) => {
  res.render('operator', { user: req.session.user,activePage: 'operator' , title : 'Operators' });
};