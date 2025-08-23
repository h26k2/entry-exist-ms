const { createAuthenticatedClient } = require('../utils/zkbiotime');

// Render users management page
exports.renderUsersPage = async (req, res) => {
  try {
    res.render("user-management", {
      user: req.session.user,
      activePage: "users",
      title: "User Management",
      error: req.query.error || null,
      success: req.query.success || null,
    });
  } catch (err) {
    console.error(err);
    res.render("user-management", {
      user: req.session.user,
      activePage: "users",
      title: "User Management",
      error: "Error loading users page",
      success: null,
    });
  }
};

// Get all users from ZKBioTime API
exports.getUsers = async (req, res) => {
  try {
    const client = await createAuthenticatedClient();
    const response = await client.get('/personnel/api/employees/?page_size=10000');
    
    if (response.data.code === 0) {
      const users = response.data.data.map(user => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name
      }));
      
      res.json({
        success: true,
        users
      });
    } else {
      throw new Error(response.data.msg || 'Failed to fetch users');
    }
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users from ZKBioTime"
    });
  }
};

// Add new user to ZKBioTime
exports.addUser = async (req, res) => {
  const { first_name, last_name } = req.body;

  try {
    if (!first_name || !last_name) {
      return res.json({
        success: false,
        message: "First name and last name are required"
      });
    }

    // Generate emp_code with date and random sequence
    const today = new Date();
    const dateStr = today.getFullYear().toString() + 
                   (today.getMonth() + 1).toString().padStart(2, '0') + 
                   today.getDate().toString().padStart(2, '0');
    const randomKey = Math.random().toString(36).substring(2, 8).toUpperCase();
    const emp_code = `${dateStr}_${randomKey}`;

    const userData = {
      first_name,
      last_name,
      department: 1,
      area: [2],
      emp_code
    };

    console.log('Attempting to create user with data:', userData); // Debug log

    const client = await createAuthenticatedClient();
    
    // Debug: Check if client has proper headers
    console.log('Client headers:', client.defaults.headers); // Debug log
    
    const response = await client.post('/personnel/api/employees/', userData);

    console.log('ZKBioTime API Response:', response.data); // Debug log

    if (response.data && (response.data.code === 0 || response.status === 200 || response.status === 201)) {
      res.json({
        success: true,
        message: "User added successfully",
        user: response.data.data || response.data
      });
    } else {
      throw new Error(response.data?.msg || response.data?.message || 'Failed to add user');
    }
  } catch (err) {
    console.error('Error adding user:', err);
    console.error('Error response:', err.response?.data); // Debug log
    
    let errorMessage = "Failed to add user";
    if (err.response?.data?.msg) {
      errorMessage = err.response.data.msg;
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    res.json({
      success: false,
      message: errorMessage
    });
  }
};
