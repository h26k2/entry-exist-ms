const DatabaseHelper = require("../config/dbHelper");

// Render people management page
exports.renderPeoplePage = async (req, res) => {
  try {
    const categories = await DatabaseHelper.query(
      "SELECT * FROM categories ORDER BY name"
    );
    const people = await DatabaseHelper.query(`
      SELECT p.*, c.name as category_name,
             (SELECT COUNT(*) FROM people p2 WHERE p2.host_person_id = p.id) as family_members_count
      FROM people p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
      ORDER BY p.name
      LIMIT 50
    `);

    res.render("people-management", {
      user: req.session.user,
      activePage: "people",
      title: "People Management",
      categories,
      people,
      error: req.query.error || null,
      success: req.query.success || null,
    });
  } catch (err) {
    console.error(err);
    res.render("people-management", {
      user: req.session.user,
      activePage: "people",
      title: "People Management",
      categories: [],
      people: [],
      error: "Error loading people page",
      success: null,
    });
  }
};

// Get people stats for dashboard
exports.getPeopleStats = async (req, res) => {
  try {
    const [totalPeople] = await DatabaseHelper.query(
      "SELECT COUNT(*) as count FROM people WHERE is_active = 1"
    );

    const [activeMembers] = await DatabaseHelper.query(
      "SELECT COUNT(*) as count FROM people WHERE is_active = 1 AND is_family_member = 0"
    );

    const [familyGroups] = await DatabaseHelper.query(
      "SELECT COUNT(DISTINCT host_person_id) as count FROM people WHERE host_person_id IS NOT NULL AND is_active = 1"
    );

    const [recentAdditions] = await DatabaseHelper.query(
      "SELECT COUNT(*) as count FROM people WHERE is_active = 1 AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
    );

    res.json({
      success: true,
      totalPeople: totalPeople.count,
      activeMembers: activeMembers.count,
      familyGroups: familyGroups.count,
      recentAdditions: recentAdditions.count,
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to get stats" });
  }
};

// Get all people with pagination and filters
exports.getAllPeople = async (req, res) => {
  try {
    const { page = 1, limit = 50, category, status, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE p.is_active = 1";
    const params = [];

    if (search) {
      whereClause += " AND (p.name LIKE ? OR p.cnic LIKE ? OR p.phone LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category) {
      whereClause += " AND p.category_id = ?";
      params.push(category);
    }

    if (status === "active") {
      whereClause += " AND p.is_active = 1";
    } else if (status === "blocked") {
      whereClause += " AND p.is_active = 0";
    }

    const people = await DatabaseHelper.query(
      `
      SELECT p.*, c.name as category_name,
             (SELECT COUNT(*) FROM people p2 WHERE p2.host_person_id = p.id) as family_members_count
      FROM people p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.name
      LIMIT ? OFFSET ?
    `,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({ success: true, people });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to get people" });
  }
};

// Search people for quick search
exports.searchPeopleQuick = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.json({ success: true, people: [] });
    }

    const people = await DatabaseHelper.query(
      `
      SELECT p.*, c.name as category_name,
             p.card_number,
             (SELECT COUNT(*) FROM people p2 WHERE p2.host_person_id = p.id) as family_members_count
      FROM people p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1 
      AND (p.name LIKE ? OR p.cnic LIKE ? OR p.phone LIKE ?)
      ORDER BY p.name
      LIMIT 20
    `,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );

    res.json({ success: true, people });
  } catch (err) {
    console.error("Error in searchPeopleQuick:", err);
    res.json({ success: false, message: "Search failed" });
  }
};

// Search people with advanced filters
exports.searchPeople = async (req, res) => {
  const { query, category_id, is_family_member, has_card } = req.body;

  try {
    let whereClause = "WHERE p.is_active = 1";
    const params = [];

    if (query) {
      whereClause += " AND (p.cnic LIKE ? OR p.name LIKE ? OR p.phone LIKE ?)";
      params.push(`%${query}%`, `%${query}%`, `%${query}%`);
    }

    if (category_id) {
      whereClause += " AND p.category_id = ?";
      params.push(category_id);
    }

    if (is_family_member !== undefined) {
      whereClause += " AND p.is_family_member = ?";
      params.push(is_family_member);
    }

    if (has_card !== undefined) {
      whereClause +=
        has_card === "1"
          ? " AND p.card_number IS NOT NULL"
          : " AND p.card_number IS NULL";
    }

    const people = await DatabaseHelper.query(
      `
      SELECT p.*, c.name as category_name, c.requires_payment,
             (SELECT name FROM people WHERE id = p.host_person_id) as host_name,
             (SELECT COUNT(*) FROM people p2 WHERE p2.host_person_id = p.id) as family_members_count
      FROM people p 
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.name LIMIT 50
    `,
      params
    );

    res.json({ success: true, people });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Search failed" });
  }
};

// Add new person
exports.addPerson = async (req, res) => {
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
    generate_card,
  } = req.body;

  try {
    let cardNumber = null;
    let cardIssuedDate = null;

    if (generate_card === "1") {
      cardNumber = "CARD" + Date.now().toString().slice(-8);
      cardIssuedDate = new Date().toISOString().split("T")[0];
    }

    const result = await DatabaseHelper.query(
      `
      INSERT INTO people (cnic, name, phone, address, category_id, is_family_member, 
                         host_person_id, emergency_contact, remarks, card_number, card_issued_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        cnic,
        name,
        phone || null,
        address || null,
        category_id,
        is_family_member === "1",
        host_person_id || null,
        emergency_contact || null,
        remarks || null,
        cardNumber,
        cardIssuedDate,
      ]
    );

    res.json({
      success: true,
      person_id: result.insertId,
      card_number: cardNumber,
      message: "Person added successfully",
    });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      res.json({ success: false, message: "CNIC already exists" });
    } else {
      res.json({ success: false, message: "Failed to add person" });
    }
  }
};

// Update person
exports.updatePerson = async (req, res) => {
  const { id } = req.params;
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
    await DatabaseHelper.query(
      `
      UPDATE people 
      SET cnic = ?, name = ?, phone = ?, address = ?, category_id = ?, 
          is_family_member = ?, host_person_id = ?, emergency_contact = ?, 
          remarks = ?, updated_at = NOW()
      WHERE id = ?
    `,
      [
        cnic,
        name,
        phone || null,
        address || null,
        category_id,
        is_family_member === "1",
        host_person_id || null,
        emergency_contact || null,
        remarks || null,
        id,
      ]
    );

    res.json({ success: true, message: "Person updated successfully" });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      res.json({ success: false, message: "CNIC already exists" });
    } else {
      res.json({ success: false, message: "Failed to update person" });
    }
  }
};

// Delete person (soft delete)
exports.deletePerson = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if person has active entries
    const activeEntries = await DatabaseHelper.query(
      `
      SELECT COUNT(*) as count 
      FROM entry_logs 
      WHERE person_id = ? AND entry_type = 'ENTRY' AND exit_time IS NULL
    `,
      [id]
    );

    if (activeEntries[0].count > 0) {
      return res.json({
        success: false,
        message:
          "Cannot delete person with active entries. Please process exit first.",
      });
    }

    // Soft delete
    await DatabaseHelper.query("UPDATE people SET is_active = 0 WHERE id = ?", [
      id,
    ]);

    res.json({ success: true, message: "Person deleted successfully" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to delete person" });
  }
};

// Get person details with family members
exports.getPersonDetails = async (req, res) => {
  const { id } = req.params;

  try {
    // Get person details
    const person = await DatabaseHelper.query(
      `
      SELECT p.*, c.name as category_name, c.requires_payment,
             (SELECT name FROM people WHERE id = p.host_person_id) as host_name
      FROM people p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `,
      [id]
    );

    if (person.length === 0) {
      return res.json({ success: false, message: "Person not found" });
    }

    // Get family members if this person is a host
    const familyMembers = await DatabaseHelper.query(
      `
      SELECT p.*, c.name as category_name
      FROM people p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.host_person_id = ? AND p.is_active = 1
    `,
      [id]
    );

    // Get recent entry history
    const recentEntries = await DatabaseHelper.query(
      `
      SELECT el.*, u.name as operator_name
      FROM entry_logs el
      JOIN users u ON el.operator_id = u.id
      WHERE el.person_id = ?
      ORDER BY el.entry_time DESC
      LIMIT 10
    `,
      [id]
    );

    // Get fee deposits
    const deposits = await DatabaseHelper.query(
      `
      SELECT fd.*, u.name as deposited_by_name
      FROM fee_deposits fd
      JOIN users u ON fd.deposited_by = u.id
      WHERE fd.person_id = ?
      ORDER BY fd.deposit_date DESC
      LIMIT 10
    `,
      [id]
    );

    const balance = await DatabaseHelper.query(
      `
      SELECT SUM(amount) as available_balance
      FROM fee_deposits 
      WHERE person_id = ? AND status = 'ACTIVE'
    `,
      [id]
    );

    res.json({
      success: true,
      person: person[0],
      familyMembers,
      recentEntries,
      deposits,
      available_balance: balance[0]?.available_balance || 0,
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to get person details" });
  }
};

// Add family member
exports.addFamilyMember = async (req, res) => {
  const { host_person_id, cnic, name, phone, emergency_contact, remarks } =
    req.body;

  try {
    // Get host person's category
    const hostInfo = await DatabaseHelper.query(
      `
      SELECT category_id FROM people WHERE id = ?
    `,
      [host_person_id]
    );

    if (hostInfo.length === 0) {
      return res.json({ success: false, message: "Host person not found" });
    }

    const result = await DatabaseHelper.query(
      `
      INSERT INTO people (cnic, name, phone, category_id, is_family_member, 
                         host_person_id, emergency_contact, remarks)
      VALUES (?, ?, ?, ?, 1, ?, ?, ?)
    `,
      [
        cnic,
        name,
        phone || null,
        hostInfo[0].category_id,
        host_person_id,
        emergency_contact || null,
        remarks || null,
      ]
    );

    res.json({
      success: true,
      family_member_id: result.insertId,
      message: "Family member added successfully",
    });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      res.json({ success: false, message: "CNIC already exists" });
    } else {
      res.json({ success: false, message: "Failed to add family member" });
    }
  }
};

// Get people by category for dropdown
exports.getPeopleByCategory = async (req, res) => {
  const { category_id } = req.params;

  try {
    const people = await DatabaseHelper.query(
      `
      SELECT id, name, cnic
      FROM people 
      WHERE category_id = ? AND is_active = 1 AND is_family_member = 0
      ORDER BY name
      LIMIT 100
    `,
      [category_id]
    );

    res.json({ success: true, people });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to get people" });
  }
};

// Bulk import people from CSV
exports.bulkImportPeople = async (req, res) => {
  const csv = require("csv-parse");
  const fs = require("fs");
  const db = require("../config/db");
  try {
    if (!req.file) {
      return res.json({ success: false, message: "No file uploaded" });
    }
    const filePath = req.file.path;
    const results = [];
    const errors = [];
    const parser = fs
      .createReadStream(filePath)
      .pipe(csv.parse({ columns: true, trim: true }));
    for await (const row of parser) {
      // Validate required fields
      if (!row.CNIC || !row.Name) {
        errors.push({ row, error: "Missing CNIC or Name" });
        continue;
      }
      // Insert into DB
      try {
        await db.query(
          "INSERT INTO people (cnic, name, phone, address, category, emergency_contact) VALUES (?, ?, ?, ?, ?, ?)",
          [
            row.CNIC,
            row.Name,
            row.Phone || "",
            row.Address || "",
            row.Category || "",
            row["Emergency Contact"] || "",
          ]
        );
        results.push(row);
      } catch (dbErr) {
        errors.push({ row, error: dbErr.message });
      }
    }
    res.json({
      success: true,
      imported: results.length,
      failed: errors.length,
      errors,
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Bulk import failed" });
  }
};
