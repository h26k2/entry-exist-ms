const { createAuthenticatedClient } = require('../utils/zkbiotime');
const db = require('../config/db');

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

// Get all users from ZKBioTime API with pagination, search, and filter
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const typeFilter = req.query.type || '';

    console.log(`Fetching users: page=${page}, limit=${limit}, offset=${offset}, search="${search}", typeFilter="${typeFilter}"`);

    const client = await createAuthenticatedClient();
    const response = await client.get('/personnel/api/employees/?page_size=10000');
    
    if (response.data.code === 0) {
      // Get ZKBioTime users
      const allZkUsers = response.data.data.map(user => ({
        emp_code: user.emp_code,
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name
      }));

      // Get app_users registration data including names
      const [appUsersRows] = await db.execute(
        'SELECT id, type, cnic_number, first_name, last_name FROM app_users'
      );
      
      // Create a map for quick lookup
      const appUsersMap = {};
      appUsersRows.forEach(user => {
        appUsersMap[user.id] = {
          type: user.type,
          cnic_number: user.cnic_number,
          first_name: user.first_name,
          last_name: user.last_name,
          isRegistered: true
        };
      });

      // Combine data
      let allCombinedUsers = allZkUsers.map(user => {
        const registrationData = appUsersMap[user.emp_code] || { isRegistered: false };
        
        // Use names from app_users table if registered, otherwise use ZKBioTime names
        const displayFirstName = registrationData.isRegistered ? registrationData.first_name : user.first_name;
        const displayLastName = registrationData.isRegistered ? registrationData.last_name : user.last_name;
        
        return {
          ...user,
          displayFirstName,
          displayLastName,
          fullName: `${displayFirstName || ''} ${displayLastName || ''}`.trim(),
          registrationData
        };
      });

      // Apply search filter
      if (search.trim()) {
        const searchLower = search.toLowerCase().trim();
        allCombinedUsers = allCombinedUsers.filter(user => {
          // Search in name (first + last name)
          const fullName = `${user.displayFirstName || ''} ${user.displayLastName || ''}`.toLowerCase().trim();
          const nameMatch = fullName.includes(searchLower);
          
          // Search in CNIC (only for registered users)
          const cnicMatch = user.registrationData.isRegistered && 
            user.registrationData.cnic_number && 
            user.registrationData.cnic_number.includes(searchLower);
          
          return nameMatch || cnicMatch;
        });
      }

      // Apply type filter
      if (typeFilter.trim()) {
        allCombinedUsers = allCombinedUsers.filter(user => {
          if (typeFilter === 'unregistered') {
            return !user.registrationData.isRegistered;
          } else {
            return user.registrationData.isRegistered && 
                   user.registrationData.type === typeFilter;
          }
        });
      }

      // Apply pagination
      const totalRecords = allCombinedUsers.length;
      const paginatedUsers = allCombinedUsers.slice(offset, offset + limit);
      const totalPages = Math.ceil(totalRecords / limit);
      
      res.json({
        success: true,
        users: paginatedUsers,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalRecords: totalRecords,
          recordsPerPage: limit,
          recordsOnPage: paginatedUsers.length,
          startRecord: offset + 1,
          endRecord: Math.min(offset + limit, totalRecords)
        }
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

// Get detailed app user data
exports.getUserDetails = async (req, res) => {
  try {
    const { emp_code } = req.params;
    console.log('Getting user details for emp_code:', emp_code);
    
    const [rows] = await db.execute(
      'SELECT * FROM app_users WHERE id = ?',
      [emp_code]
    );

    console.log('Found rows:', rows.length);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found in registration database"
      });
    }

    const user = rows[0];
    
    // Helper function to safely parse JSON
    const safeJsonParse = (jsonString, fieldName) => {
      if (!jsonString) return null;
      try {
        return JSON.parse(jsonString);
      } catch (error) {
        console.error(`Error parsing JSON for field ${fieldName}:`, error);
        console.error(`JSON string was:`, jsonString);
        return null;
      }
    };
    
    // Parse JSON fields safely
    const parsedUser = {
      ...user,
      profession: safeJsonParse(user.profession, 'profession'),
      father_profession: safeJsonParse(user.father_profession, 'father_profession'),
      family_details: safeJsonParse(user.family_details, 'family_details'),
      home_address: safeJsonParse(user.home_address, 'home_address'),
      sponsored_serving_military_officer_details: safeJsonParse(user.sponsored_serving_military_officer_details, 'sponsored_serving_military_officer_details'),
      verified_by_rac_details: safeJsonParse(user.verified_by_rac_details, 'verified_by_rac_details'),
      ctr_signed_by_hq_malir_details: safeJsonParse(user.ctr_signed_by_hq_malir_details, 'ctr_signed_by_hq_malir_details')
    };

    res.json({
      success: true,
      user: parsedUser
    });

  } catch (err) {
    console.error('Error fetching user details:', err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user details"
    });
  }
};

// Update user in app_users table
exports.updateAppUser = async (req, res) => {
  try {
    const { emp_code } = req.params;
    console.log('Updating user with emp_code:', emp_code);
    console.log('Request body:', req.body);
    
    const {
      first_name,
      last_name,
      type,
      cnic_number,
      pa_num,
      rank,
      retired_unit_hq,
      original_unit,
      current_unit,
      profession,
      father_name,
      father_profession,
      family_details,
      home_address,
      sponsored_serving_military_officer,
      sponsored_serving_military_officer_details,
      verified_by_rac,
      verified_by_rac_details,
      ctr_signed_by_hq_malir,
      ctr_signed_by_hq_malir_details,
      oic_gsc_recommended,
      co_maint_unit_recommended,
      amount_payable,
      discount,
      net_payable,
      billing_mode,
      garrisson_id_for_sponsored,
      garrisson_name
    } = req.body;

    // Validation
    if (!type || !cnic_number) {
      return res.json({
        success: false,
        message: "Type and CNIC number are required"
      });
    }

    // Validate CNIC format (13 digits)
    if (!/^\d{13}$/.test(cnic_number)) {
      return res.json({
        success: false,
        message: "CNIC number must be exactly 13 digits without dashes"
      });
    }

    // Set billing mode based on type
    let finalBillingMode = billing_mode;
    if (type === 'Serving personnel') {
      finalBillingMode = 'sponsored';
    }

    const query = `
      UPDATE app_users SET
        first_name = ?, last_name = ?, type = ?, cnic_number = ?, pa_num = ?, rank = ?, retired_unit_hq = ?, original_unit = ?, current_unit = ?,
        profession = ?, father_name = ?, father_profession = ?, family_details = ?, home_address = ?,
        sponsored_serving_military_officer = ?, sponsored_serving_military_officer_details = ?,
        verified_by_rac = ?, verified_by_rac_details = ?, ctr_signed_by_hq_malir = ?, ctr_signed_by_hq_malir_details = ?,
        oic_gsc_recommended = ?, co_maint_unit_recommended = ?, billing_mode = ?,
        amount_payable = ?, discount = ?, net_payable = ?, payment_terms = ?,
        garrisson_id_for_sponsored = ?, garrisson_name = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const values = [
      first_name || null,
      last_name || null,
      type,
      cnic_number,
      pa_num || null,
      rank || null,
      retired_unit_hq || null,
      original_unit || null,
      current_unit || null,
      profession ? JSON.stringify(profession) : null,
      father_name || null,
      father_profession ? JSON.stringify(father_profession) : null,
      family_details ? JSON.stringify(family_details) : null,
      home_address ? JSON.stringify(home_address) : null,
      sponsored_serving_military_officer || 'no',
      sponsored_serving_military_officer_details ? JSON.stringify(sponsored_serving_military_officer_details) : null,
      verified_by_rac || 'no',
      verified_by_rac_details ? JSON.stringify(verified_by_rac_details) : null,
      ctr_signed_by_hq_malir || 'no',
      ctr_signed_by_hq_malir_details ? JSON.stringify(ctr_signed_by_hq_malir_details) : null,
      oic_gsc_recommended || 'no',
      co_maint_unit_recommended || 'no',
      finalBillingMode || 'self',
      amount_payable || 0,
      discount || 0,
      net_payable || 0,
      'monthly',
      garrisson_id_for_sponsored || null,
      garrisson_name || null,
      emp_code
    ];

    console.log('Executing query:', query);
    console.log('With values:', values);

    const [result] = await db.execute(query, values);

    console.log('Query result:', result);
    console.log('Affected rows:', result.affectedRows);

    if (result.affectedRows === 0) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      message: "User updated successfully"
    });

  } catch (err) {
    console.error('Error updating app user:', err);
    
    let errorMessage = "Failed to update user";
    if (err.code === 'ER_DUP_ENTRY') {
      if (err.message.includes('cnic_number')) {
        errorMessage = "A user with this CNIC number already exists";
      } else if (err.message.includes('pa_num')) {
        errorMessage = "A user with this PA number already exists";
      } else {
        errorMessage = "Duplicate entry detected";
      }
    }
    
    res.json({
      success: false,
      message: errorMessage
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
        message: "User added successfully to ZKBioTime",
        user: response.data.data || response.data,
        emp_code: emp_code // Return emp_code for app_users registration
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

// Register user in app_users table after ZKBioTime creation
exports.registerAppUser = async (req, res) => {
  try {
    const {
      emp_code,
      first_name,
      last_name,
      type,
      cnic_number,
      pa_num,
      rank,
      retired_unit_hq,
      original_unit,
      current_unit,
      profession,
      father_name,
      father_profession,
      family_details,
      home_address,
      sponsored_serving_military_officer,
      sponsored_serving_military_officer_details,
      verified_by_rac,
      verified_by_rac_details,
      ctr_signed_by_hq_malir,
      ctr_signed_by_hq_malir_details,
      oic_gsc_recommended,
      co_maint_unit_recommended,
      amount_payable,
      discount,
      net_payable,
      billing_mode,
      garrisson_id_for_sponsored,
      garrisson_name
    } = req.body;

    // Validation
    if (!emp_code || !type || !cnic_number) {
      return res.json({
        success: false,
        message: "Employee code, type, and CNIC number are required"
      });
    }

    // Validate CNIC format (13 digits)
    if (!/^\d{13}$/.test(cnic_number)) {
      return res.json({
        success: false,
        message: "CNIC number must be exactly 13 digits without dashes"
      });
    }

    // Calculate current date
    const currentDate = new Date().toISOString().split('T')[0];

    // Set billing mode based on type
    let finalBillingMode = billing_mode;
    if (type === 'Serving personnel') {
      finalBillingMode = 'sponsored';
    }

    const query = `
      INSERT INTO app_users (
        id, first_name, last_name, type, cnic_number, pa_num, rank, retired_unit_hq, original_unit, current_unit,
        profession, father_name, father_profession, family_details, home_address,
        sponsored_serving_military_officer, sponsored_serving_military_officer_details,
        verified_by_rac, verified_by_rac_details, ctr_signed_by_hq_malir, ctr_signed_by_hq_malir_details,
        oic_gsc_recommended, co_maint_unit_recommended, date, billing_mode,
        amount_payable, discount, net_payable, payment_terms,
        garrisson_id_for_sponsored, garrisson_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      emp_code,
      first_name || null,
      last_name || null,
      type,
      cnic_number,
      pa_num || null,
      rank || null,
      retired_unit_hq || null,
      original_unit || null,
      current_unit || null,
      profession ? JSON.stringify(profession) : null,
      father_name || null,
      father_profession ? JSON.stringify(father_profession) : null,
      family_details ? JSON.stringify(family_details) : null,
      home_address ? JSON.stringify(home_address) : null,
      sponsored_serving_military_officer || 'no',
      sponsored_serving_military_officer_details ? JSON.stringify(sponsored_serving_military_officer_details) : null,
      verified_by_rac || 'no',
      verified_by_rac_details ? JSON.stringify(verified_by_rac_details) : null,
      ctr_signed_by_hq_malir || 'no',
      ctr_signed_by_hq_malir_details ? JSON.stringify(ctr_signed_by_hq_malir_details) : null,
      oic_gsc_recommended || 'no',
      co_maint_unit_recommended || 'no',
      currentDate,
      finalBillingMode || 'self',
      amount_payable || 0,
      discount || 0,
      net_payable || 0,
      'monthly',
      garrisson_id_for_sponsored || null,
      garrisson_name || null
    ];

    await db.execute(query, values);

    res.json({
      success: true,
      message: "User registered successfully in application database"
    });

  } catch (err) {
    console.error('Error registering app user:', err);
    
    let errorMessage = "Failed to register user in application database";
    if (err.code === 'ER_DUP_ENTRY') {
      if (err.message.includes('cnic_number')) {
        errorMessage = "A user with this CNIC number already exists";
      } else if (err.message.includes('pa_num')) {
        errorMessage = "A user with this PA number already exists";
      } else {
        errorMessage = "This user is already registered";
      }
    }
    
    res.json({
      success: false,
      message: errorMessage
    });
  }
};
