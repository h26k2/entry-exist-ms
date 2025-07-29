// Render card generation page
exports.renderCardGenerationPage = (req, res) => {
  res.render("card-generation");
};

// API to generate a card for a person
exports.generateCard = async (req, res) => {
  const { cnic, name } = req.body;
  if (!cnic) {
    return res.json({ success: false, message: "CNIC is required." });
  }
  try {
    // Check if person exists
    const people = await require("../config/dbHelper").query(
      "SELECT * FROM people WHERE cnic = ?",
      [cnic]
    );
    let person = people[0];
    let cardNumber = "CARD" + Date.now().toString().slice(-8);
    let issuedDate = new Date().toISOString().split("T")[0];
    if (person) {
      // Update card info if person exists
      await require("../config/dbHelper").query(
        "UPDATE people SET card_number = ?, card_issued_date = ? WHERE id = ?",
        [cardNumber, issuedDate, person.id]
      );
      return res.json({
        success: true,
        card_number: cardNumber,
        card_issued_date: issuedDate,
        message: "Card generated and linked to existing person.",
      });
    } else {
      if (!name) {
        return res.json({
          success: false,
          message: "Name is required to create a new person.",
        });
      }
      // Create new person with card info
      await require("../config/dbHelper").query(
        "INSERT INTO people (cnic, name, card_number, card_issued_date) VALUES (?, ?, ?, ?)",
        [cnic, name, cardNumber, issuedDate]
      );
      return res.json({
        success: true,
        card_number: cardNumber,
        card_issued_date: issuedDate,
        message: "Person created and card generated.",
      });
    }
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Failed to generate card." });
  }
};
const DatabaseHelper = require("../config/dbHelper");

// Render entry management page
exports.renderEntryPage = async (req, res) => {
  try {
    const categories = await DatabaseHelper.query(
      "SELECT * FROM categories WHERE id > 0 ORDER BY name"
    );
    const facilities = await DatabaseHelper.query(
      "SELECT * FROM facilities WHERE is_active = 1 ORDER BY name"
    );
    const currentOccupancy = await DatabaseHelper.query(`
      SELECT COUNT(*) as total_people,
             SUM(CASE WHEN is_guest = 1 THEN guest_count ELSE 1 END) as total_count,
             SUM(CASE WHEN is_cricket_team = 1 THEN team_members_count ELSE 1 END) as team_members
      FROM current_occupancy
    `);

    res.render("entry-management", {
      user: req.session.user,
      activePage: "entry",
      title: "Entry Management",
      categories,
      facilities,
      currentCount: currentOccupancy[0]?.total_count || 0,
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
        c.name as category, 
        c.requires_payment,
        COALESCE(
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
    const people = await DatabaseHelper.query(
      `
      SELECT p.*, c.name as category_name, el.entry_time, el.total_amount
      FROM people p 
      LEFT JOIN categories c ON p.category_id = c.id
      JOIN entry_logs el ON p.id = el.person_id
      WHERE (p.cnic LIKE ? OR p.name LIKE ?) 
        AND el.entry_type = 'ENTRY' 
        AND el.exit_time IS NULL
        AND el.id = (
          SELECT MAX(id) FROM entry_logs el2 
          WHERE el2.person_id = p.id
        )
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
    // Check if person is already inside
    const existingEntry = await DatabaseHelper.query(
      `
      SELECT id FROM entry_logs 
      WHERE person_id = ? AND entry_type = 'ENTRY' AND exit_time IS NULL
      ORDER BY id DESC LIMIT 1
    `,
      [person_id]
    );

    if (existingEntry.length > 0) {
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

    // Create entry log
    const entryResult = await DatabaseHelper.query(
      `
      INSERT INTO entry_logs (
        person_id, entry_type, operator_id, has_stroller, vehicle_number,
        is_guest, host_person_id, guest_count, is_cricket_team, team_name,
        team_members_count, total_amount, payment_status, remarks, is_fee_locked
      ) VALUES (?, 'ENTRY', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        person_id,
        operatorId,
        has_stroller === "1",
        vehicle_number,
        is_guest === "1",
        host_person_id || null,
        guest_count || 1,
        is_cricket_team === "1",
        team_name,
        team_members_count || 0,
        totalAmount,
        paymentStatus,
        remarks,
        req.session.user.role !== "admin", // Lock fee for operators
      ]
    );

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
    const entryLog = await DatabaseHelper.query(
      `
      SELECT * FROM entry_logs 
      WHERE person_id = ? AND entry_type = 'ENTRY' AND exit_time IS NULL
      ORDER BY id DESC LIMIT 1
    `,
      [person_id]
    );

    if (entryLog.length === 0) {
      return res.json({
        success: false,
        message: "No active entry found for this person",
      });
    }

    // Update exit time
    await DatabaseHelper.query(
      `
      UPDATE entry_logs 
      SET exit_time = NOW(), remarks = CONCAT(IFNULL(remarks, ''), ' | Exit: ', ?)
      WHERE id = ?
    `,
      [exit_remarks || "Normal exit", entryLog[0].id]
    );

    res.json({ success: true, message: "Exit recorded successfully" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Exit processing failed" });
  }
};

// Get current occupancy
exports.getCurrentOccupancy = async (req, res) => {
  try {
    const occupancy = await DatabaseHelper.query(`
      SELECT 
        p.name,
        p.cnic,
        c.name as category,
        el.entry_time,
        el.has_stroller,
        el.is_guest,
        el.guest_count,
        el.is_cricket_team,
        el.team_name,
        el.team_members_count,
        TIMESTAMPDIFF(HOUR, el.entry_time, NOW()) as hours_inside
      FROM entry_logs el
      JOIN people p ON el.person_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE el.entry_type = 'ENTRY' AND el.exit_time IS NULL
      ORDER BY el.entry_time DESC
    `);

    const totalCount = occupancy.reduce((sum, person) => {
      if (person.is_cricket_team) {
        return sum + person.team_members_count;
      } else if (person.is_guest) {
        return sum + person.guest_count;
      } else {
        return sum + 1;
      }
    }, 0);

    res.json({ success: true, occupancy, totalCount });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to get occupancy data" });
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
