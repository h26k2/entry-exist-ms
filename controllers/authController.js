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

exports.renderOperatorPage = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM users WHERE role = ?', ['operator']);
    res.render('operator', {
      user: req.session.user,
      activePage: 'operator',
      title: 'Operators',
      operators: results,
      error: req.query.error || null,
      success: req.query.success || null
    });
  } catch (err) {
    console.error(err);
    res.render('operator', {
      user: req.session.user,
      activePage: 'operator',
      title: 'Operators',
      operators: [],
      error: 'Error fetching operators',
      success: null
    });
  }
};

exports.addOperator = async (req, res) => {
  const { name, cnic, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO users (name, cnic_num, password, role) VALUES (?, ?, ?, ?)',
      [name, cnic, hashedPassword, 'operator']
    );

    res.redirect('/dashboard/operator');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding operator');
  }
};

exports.updateOperator = async (req, res) => {
  const { id } = req.params;
  const { name, cnic, password } = req.body;

  try {
    let query = 'UPDATE users SET name = ?, cnic_num = ?';
    const params = [name, cnic];

    // Only update password if a new one is provided
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = ?';
      params.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await db.query(query, params);
    res.redirect('/dashboard/operator?success=Record updated successfully.h');
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.redirect('/dashboard/operator?error=Unable to update operator: CNIC already exists');
    } else {
      res.redirect('/dashboard/operator?error=Update failed');
    }
  }
};


exports.deleteOperators = async (req, res) => {
  const { selectedUsers } = req.body;

  if (!Array.isArray(selectedUsers) || selectedUsers.length === 0) {
    return res.redirect('/dashboard/operator');
  }

  try {
    await db.query(`DELETE FROM users WHERE id IN (${selectedUsers.map(() => '?').join(',')})`, selectedUsers);
    res.redirect('/dashboard/operator');
  } catch (err) {
    console.error(err);
    res.status(500).send('Delete error');
  }
};
