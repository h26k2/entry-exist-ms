const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs").promises;
const DatabaseHelper = require("../config/dbHelper");
const { createAuthenticatedClient } = require('../utils/zkbiotime');

/**
 * Get entries/transactions from ZKBioTime
 */
async function getZKEntries(options = {}) {
    try {
    const client = await createAuthenticatedClient();
    const params = new URLSearchParams();
    if (options.startTime) params.append('start_time', options.startTime);
    if (options.endTime) params.append('end_time', options.endTime);
    if (options.page) params.append('page', options.page);
    if (options.pageSize) params.append('page_size', options.pageSize);
    // Fetch from local ZKBioTime server
    const response = await client.get(`/iclock/api/transactions/?${params.toString()}`);
    if (response.data.code !== 0) {
      throw new Error(response.data.msg || 'Failed to fetch entries');
    }
    // Only map required fields and format date
    const entries = response.data.data.map(entry => ({
      id: entry.id,
      first_name: entry.first_name,
      last_name: entry.last_name,
      punch_state_display: entry.punch_state_display,
      punch_time: entry.punch_time ? new Date(entry.punch_time.replace(/-/g, '/')).toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) : ''
    }));
    return {
      entries,
      total: response.data.count,
      hasMore: !!response.data.next
    };
    } catch (error) {
        console.error('Failed to fetch ZKBioTime entries:', error);
        throw error;
    }
}

// API to generate a card for a person
exports.generateCard = async (req, res) => {
  const { cnic, name, person_id } = req.body;

  try {
    let cardNumber = "CARD" + Date.now().toString().slice(-8);
    let issuedDate = new Date().toISOString().split("T")[0];
    let personToUpdate = null;

    // If person_id is provided, generate card for existing person
    if (person_id) {
      const existingPerson = await DatabaseHelper.query(
        "SELECT * FROM people WHERE id = ?",
        [person_id]
      );
      if (existingPerson.length === 0) {
        return res.json({
          success: false,
          message: "Person not found.",
        });
      }
      personToUpdate = existingPerson[0];
    } else if (cnic) {
      // Check if person exists by CNIC
      const people = await DatabaseHelper.query(
        "SELECT * FROM people WHERE cnic = ?",
        [cnic]
      );
      personToUpdate = people[0];

      if (!personToUpdate && !name) {
        return res.json({
          success: false,
          message: "Name is required to create a new person.",
        });
      }
    } else {
      return res.json({
        success: false,
        message: "CNIC or person ID is required.",
      });
    }

    // Generate QR Code data (contains CNIC and card number for verification)
    const qrData = JSON.stringify({
      cnic: personToUpdate ? personToUpdate.cnic : cnic,
      cardNumber: cardNumber,
      issuedDate: issuedDate,
      type: "entry_card",
    });

    // Generate QR Code image
    const qrFileName = `qr_${cardNumber}.png`;
    const qrFilePath = path.join(__dirname, "../public/qr-codes", qrFileName);
    const qrImagePath = `/qr-codes/${qrFileName}`;

    await QRCode.toFile(qrFilePath, qrData, {
      width: 300,
      height: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    if (personToUpdate) {
      // Update existing person
      await DatabaseHelper.query(
        "UPDATE people SET card_number = ?, card_issued_date = ?, qr_code_data = ?, qr_code_image_path = ?, updated_at = NOW() WHERE id = ?",
        [cardNumber, issuedDate, qrData, qrImagePath, personToUpdate.id]
      );

      // Insert into cards table
      await DatabaseHelper.query(
        "INSERT INTO cards (person_id, card_number, qr_code_data, qr_code_image_path, issued_date, issued_by) VALUES (?, ?, ?, ?, ?, ?)",
        [
          personToUpdate.id,
          cardNumber,
          qrData,
          qrImagePath,
          issuedDate,
          req.session.user?.id || 1,
        ]
      );

      return res.json({
        success: true,
        card_number: cardNumber,
        card_issued_date: issuedDate,
        qr_code_data: qrData,
        qr_code_image_path: qrImagePath,
        message: "Card generated and linked to existing person.",
      });
    } else {
      // Create new person with card info
      const result = await DatabaseHelper.query(
        "INSERT INTO people (cnic, name, card_number, card_issued_date, qr_code_data, qr_code_image_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
        [cnic, name, cardNumber, issuedDate, qrData, qrImagePath]
      );

      // Insert into cards table
      await DatabaseHelper.query(
        "INSERT INTO cards (person_id, card_number, qr_code_data, qr_code_image_path, issued_date, issued_by) VALUES (?, ?, ?, ?, ?, ?)",
        [
          result.insertId,
          cardNumber,
          qrData,
          qrImagePath,
          issuedDate,
          req.session.user?.id || 1,
        ]
      );

      return res.json({
        success: true,
        card_number: cardNumber,
        card_issued_date: issuedDate,
        qr_code_data: qrData,
        qr_code_image_path: qrImagePath,
        message: "Person created and card generated.",
      });
    }
  } catch (err) {
    console.error("Error generating card:", err);
    return res.json({ success: false, message: "Failed to generate card." });
  }
};

// Render entry management page
exports.renderEntryPage = async (req, res) => {
  try {
    const categories = await DatabaseHelper.query(
      "SELECT * FROM categories WHERE id > 0 ORDER BY name"
    );
    const facilities = await DatabaseHelper.query(
      "SELECT * FROM facilities WHERE is_active = 1 ORDER BY name"
    );
  
    // Fetch entries from ZKBioTime
    // Get page and pageSize from query params for pagination
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const zkResponse = await getZKEntries({
      pageSize,
      page
    });
    // Only show required fields
    const entries = zkResponse.entries || [];

    res.render("entry-management", {
      user: req.session.user,
      activePage: "entry",
      title: "Entry Management",
      categories,
      facilities,
      entries,
      currentCount: entries.length || 0,
      page,
      pageSize,
      total: zkResponse.total || 0,
      error: req.query.error || null,
      success: req.query.success || null,
    });
  } catch (err) {
    console.error(err);
    res.render("entry-management", {
      user: req.session.user,
      activePage: "entry",
      title: "Entry Management",
      categories: [],
      facilities: [],
      entries: [], // Ensure entries is always defined
      currentCount: 0,
      error: "Error loading entry page",
      success: null,
    });
  }
};

// Search person by CNIC or name
exports.searchPerson = async (req, res) => {
  const { query } = req.body;

  try {
    const people = await DatabaseHelper.query(
      `
      SELECT 
        p.*, 
        c.name as category
        , COALESCE(
          (SELECT SUM(amount) FROM fee_deposits WHERE person_id = p.id AND status = 'ACTIVE'), 
          0
        ) as balance
      FROM people p 
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.cnic LIKE ? OR p.name LIKE ? 
      ORDER BY p.name LIMIT 10
    `,
      [`%${query}%`, `%${query}%`]
    );

    res.json({ success: true, people });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Search failed" });
  }
};

// Search person currently inside (for exit)
exports.searchPersonInside = async (req, res) => {
  const { query } = req.body;

  try {
    // entry_logs table removed, so only search people table and categories
    const people = await DatabaseHelper.query(
      `SELECT p.*, c.name as category_name FROM people p LEFT JOIN categories c ON p.category_id = c.id WHERE p.cnic LIKE ? OR p.name LIKE ? ORDER BY p.name LIMIT 10`,
      [`%${query}%`, `%${query}%`]
    );
    res.json({ success: true, people });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Search failed" });
  }
};

// Register new person
exports.registerPerson = async (req, res) => {
  const {
    cnic,
    name,
    phone,
    address,
    category_id,
    is_family_member,
    host_person_id,
    emergency_contact,
    remarks,
  } = req.body;

  try {
    // Generate card number
    const cardNumber = "CARD" + Date.now().toString().slice(-8);

    const result = await DatabaseHelper.query(
      `
      INSERT INTO people (cnic, name, phone, address, category_id, is_family_member, 
                         host_person_id, emergency_contact, remarks, card_number, card_issued_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
    `,
      [
        cnic,
        name,
        phone,
        address,
        category_id,
        is_family_member || false,
        host_person_id || null,
        emergency_contact,
        remarks,
        cardNumber,
      ]
    );

    res.json({
      success: true,
      person_id: result.insertId,
      card_number: cardNumber,
      message: "Person registered successfully",
    });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      res.json({ success: false, message: "CNIC already exists" });
    } else {
      res.json({ success: false, message: "Registration failed" });
    }
  }
};

// Process entry
exports.processEntry = async (req, res) => {
  const {
    person_id,
    has_stroller,
    vehicle_number,
    is_guest,
    host_person_id,
    guest_count,
    is_cricket_team,
    team_name,
    team_members_count,
    selected_facilities,
    remarks,
  } = req.body;

  try {
    // Check if person is already inside using ZKBioTime API
    const { createAuthenticatedClient } = require('../utils/zkbiotime');
    const client = await createAuthenticatedClient();
    const response = await client.get(`/iclock/api/transactions/?emp_code=${person_id}&page_size=10`);
    const entries = response.data.data || [];
    const lastEntry = entries.find(e => e.punch_state_display === 'Check In');
    const lastExit = entries.find(e => e.punch_state_display === 'Check Out');
    if (lastEntry && (!lastExit || new Date(lastEntry.punch_time) > new Date(lastExit.punch_time))) {
      return res.json({
        success: false,
        message: "Person is already inside the facility",
      });
    }

    // Get person and category info
    const personInfo = await DatabaseHelper.query(
      `
      SELECT p.*, c.requires_payment, c.name as category_name
      FROM people p 
      JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `,
      [person_id]
    );

    if (personInfo.length === 0) {
      return res.json({ success: false, message: "Person not found" });
    }

    const person = personInfo[0];
    let totalAmount = 0;
    let paymentStatus = "PAID";

    // Calculate facility costs
    const facilities = selected_facilities
      ? JSON.parse(selected_facilities)
      : [];

    for (const facility of facilities) {
      const facilityInfo = await DatabaseHelper.query(
        "SELECT price FROM facilities WHERE id = ?",
        [facility.id]
      );
      if (facilityInfo.length > 0) {
        totalAmount += facilityInfo[0].price * (facility.quantity || 1);
      }
    }

    // Determine payment status based on category
    if (
      !person.requires_payment ||
      person.category_name === "Military Serving"
    ) {
      paymentStatus = "WAIVED";
      totalAmount = 0;
    } else if (is_guest === "1") {
      paymentStatus = "HOST_PAYS";
    }

    // Get user ID from session
    const operatorId = req.session.user.id || 1;

  // Entry creation now handled by ZKBioTime device, not local DB

    // Add facility usage records
    for (const facility of facilities) {
      const facilityInfo = await DatabaseHelper.query(
        "SELECT price FROM facilities WHERE id = ?",
        [facility.id]
      );

      if (facilityInfo.length > 0) {
        const quantity = facility.quantity || 1;
        const unitPrice = facilityInfo[0].price;
        const totalPrice = unitPrice * quantity;

        await DatabaseHelper.query(
          `
          INSERT INTO entry_facilities (entry_log_id, facility_id, quantity, unit_price, total_price)
          VALUES (?, ?, ?, ?, ?)
        `,
          [entryResult.insertId, facility.id, quantity, unitPrice, totalPrice]
        );
      }
    }

    res.json({
      success: true,
      message: "Entry recorded successfully",
      entry_id: entryResult.insertId,
      total_amount: totalAmount,
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      message: err.message || "Entry processing failed",
    });
  }
};

// Process exit
exports.processExit = async (req, res) => {
  const { person_id, exit_remarks } = req.body;

  try {
    // Find the latest entry without exit
  // Exit update now handled by ZKBioTime device, not local DB
  res.json({ success: true, message: "Exit recorded successfully (via ZKBioTime)" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Exit processing failed" });
  }
};

// Get current occupancy

// Render entry management page
exports.renderEntryManagementPage = async (req, res) => {
    try {
        // Get today's entries
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const entries = await getZKEntries({
            startTime: today.toISOString().slice(0, 19).replace('T', ' '),
            endTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
            pageSize: 50
        });

        res.render("entry-management", {
            title: "Entry Management",
            activePage: "entry",
            entries: entries.entries,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error fetching entries:', error);
        res.status(500).render("error", {
            message: "Failed to load entries",
            error: error
        });
    }
};

// API endpoint to get recent entries
exports.getRecentEntries = async (req, res) => {
    try {
        const { startTime, endTime, page = 1, pageSize = 50 } = req.query;
        
        const entries = await getZKEntries({
            startTime,
            endTime,
            page,
            pageSize
        });

        res.json({
            success: true,
            ...entries
        });
    } catch (error) {
        console.error('Error fetching recent entries:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Fee deposit management
exports.addFeeDeposit = async (req, res) => {
  const { person_id, amount, description, receipt_number } = req.body;

  try {
    await DatabaseHelper.query(
      `
      INSERT INTO fee_deposits (person_id, amount, description, deposited_by, receipt_number)
      VALUES (?, ?, ?, ?, ?)
    `,
      [person_id, amount, description, req.session.user.id || 1, receipt_number]
    );

    res.json({ success: true, message: "Fee deposit recorded successfully" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to record fee deposit" });
  }
};

// Get person's deposit history and balance
exports.getPersonDeposits = async (req, res) => {
  const { person_id } = req.params;

  try {
    const deposits = await DatabaseHelper.query(
      `
      SELECT fd.*, u.name as deposited_by_name
      FROM fee_deposits fd
      JOIN users u ON fd.deposited_by = u.id
      WHERE fd.person_id = ?
      ORDER BY fd.deposit_date DESC
    `,
      [person_id]
    );

    const balance = await DatabaseHelper.query(
      `
      SELECT SUM(amount) as available_balance
      FROM fee_deposits 
      WHERE person_id = ? AND status = 'ACTIVE'
    `,
      [person_id]
    );

    res.json({
      success: true,
      deposits,
      available_balance: balance[0]?.available_balance || 0,
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to get deposit information" });
  }
};
