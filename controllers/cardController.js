const DatabaseHelper = require("../config/dbHelper");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs").promises;

// Render card management page
exports.renderCardManagementPage = async (req, res) => {
  try {
    const categories = await DatabaseHelper.query(
      "SELECT * FROM categories WHERE id > 0 ORDER BY name"
    );

    res.render("card-management", {
      user: req.session.user,
      categories: categories,
      activePage: "cards",
      title: "Card Management",
    });
  } catch (error) {
    console.error("Error rendering card management page:", error);
    res.status(500).send("Error loading card management page");
  }
};

// Get all cards with person details
exports.getAllCards = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "" } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    let params = [];

    if (search) {
      whereClause +=
        " AND (p.name LIKE ? OR p.cnic LIKE ? OR c.card_number LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      whereClause += " AND c.status = ?";
      params.push(status);
    }

    const cardsQuery = `
      SELECT 
        c.*,
        p.name as person_name,
        p.cnic,
        p.phone,
        cat.name as category_name,
        u.name as issued_by_name
      FROM cards c
      JOIN people p ON c.person_id = p.id
      LEFT JOIN categories cat ON p.category_id = cat.id
      LEFT JOIN users u ON c.issued_by = u.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM cards c
      JOIN people p ON c.person_id = p.id
      ${whereClause}
    `;

    params.push(parseInt(limit), offset);
    const cards = await DatabaseHelper.query(cardsQuery, params);

    // Remove limit and offset for count query
    const countParams = params.slice(0, -2);
    const totalResult = await DatabaseHelper.query(countQuery, countParams);
    const total = totalResult[0].total;

    res.json({
      success: true,
      cards: cards,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching cards:", error);
    res.status(500).json({ success: false, message: "Error fetching cards" });
  }
};

// Get card details by ID
exports.getCardDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const cardQuery = `
      SELECT 
        c.*,
        p.name as person_name,
        p.cnic,
        p.phone,
        p.address,
        p.emergency_contact,
        cat.name as category_name,
        u.name as issued_by_name
      FROM cards c
      JOIN people p ON c.person_id = p.id
      LEFT JOIN categories cat ON p.category_id = cat.id
      LEFT JOIN users u ON c.issued_by = u.id
      WHERE c.id = ?
    `;

    const cards = await DatabaseHelper.query(cardQuery, [id]);

    if (cards.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Card not found" });
    }

    res.json({ success: true, card: cards[0] });
  } catch (error) {
    console.error("Error fetching card details:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching card details" });
  }
};

// Update card status
exports.updateCardStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ["ACTIVE", "INACTIVE", "LOST", "DAMAGED"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    await DatabaseHelper.query(
      "UPDATE cards SET status = ?, notes = ?, updated_at = NOW() WHERE id = ?",
      [status, notes || null, id]
    );

    res.json({ success: true, message: "Card status updated successfully" });
  } catch (error) {
    console.error("Error updating card status:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating card status" });
  }
};

// Create new card
exports.createCard = async (req, res) => {
  try {
    const { person_id, card_number, notes } = req.body;

    if (!person_id || !card_number) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Person ID and card number are required",
        });
    }

    // Check if person exists
    const persons = await DatabaseHelper.query(
      "SELECT * FROM people WHERE id = ?",
      [person_id]
    );

    if (persons.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Person not found" });
    }

    const person = persons[0];

    // Check if card number already exists
    const existingCards = await DatabaseHelper.query(
      "SELECT * FROM cards WHERE card_number = ?",
      [card_number]
    );

    if (existingCards.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Card number already exists" });
    }

    // Generate QR code data
    const qrData = JSON.stringify({
      person_id: person.id,
      cnic: person.cnic,
      card_number: card_number,
      issued_at: new Date().toISOString(),
    });

    // Generate QR code image
    const qrCodeDir = path.join(__dirname, "../public/qr-codes");
    await fs.mkdir(qrCodeDir, { recursive: true });

    const qrFileName = `card_${card_number}_${Date.now()}.png`;
    const qrFilePath = path.join(qrCodeDir, qrFileName);
    const qrImagePath = `/qr-codes/${qrFileName}`;

    await QRCode.toFile(qrFilePath, qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    // Insert card into database
    const result = await DatabaseHelper.query(
      `INSERT INTO cards (person_id, card_number, qr_code_data, qr_code_image_path, 
       status, notes, issued_date, created_at, updated_at) 
       VALUES (?, ?, ?, ?, 'ACTIVE', ?, NOW(), NOW(), NOW())`,
      [person_id, card_number, qrData, qrImagePath, notes || ""]
    );

    // Update person's QR code info
    await DatabaseHelper.query(
      "UPDATE people SET qr_code_data = ?, qr_code_image_path = ? WHERE id = ?",
      [qrData, qrImagePath, person_id]
    );

    res.json({
      success: true,
      message: "Card created successfully",
      card_id: result.insertId,
      qr_image_path: qrImagePath,
    });
  } catch (error) {
    console.error("Error creating card:", error);
    res.status(500).json({ success: false, message: "Error creating card" });
  }
};

// Delete card
exports.deleteCard = async (req, res) => {
  try {
    const { id } = req.params;

    // Get card details first to delete QR code file
    const cards = await DatabaseHelper.query(
      "SELECT * FROM cards WHERE id = ?",
      [id]
    );

    if (cards.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Card not found" });
    }

    const card = cards[0];

    // Delete QR code file if it exists
    if (card.qr_code_image_path) {
      const filePath = path.join(
        __dirname,
        "../public",
        card.qr_code_image_path
      );
      try {
        await fs.unlink(filePath);
      } catch (fileError) {
        console.warn("Could not delete QR code file:", fileError.message);
      }
    }

    // Remove card data from people table
    await DatabaseHelper.query(
      "UPDATE people SET card_number = NULL, card_issued_date = NULL, qr_code_data = NULL, qr_code_image_path = NULL WHERE id = ?",
      [card.person_id]
    );

    // Delete card record
    await DatabaseHelper.query("DELETE FROM cards WHERE id = ?", [id]);

    res.json({ success: true, message: "Card deleted successfully" });
  } catch (error) {
    console.error("Error deleting card:", error);
    res.status(500).json({ success: false, message: "Error deleting card" });
  }
};

// Generate new QR code for existing card
exports.regenerateQRCode = async (req, res) => {
  try {
    const { id } = req.params;

    // Get card details
    const cards = await DatabaseHelper.query(
      `
      SELECT c.*, p.cnic 
      FROM cards c 
      JOIN people p ON c.person_id = p.id 
      WHERE c.id = ?
    `,
      [id]
    );

    if (cards.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Card not found" });
    }

    const card = cards[0];

    // Delete old QR code file
    if (card.qr_code_image_path) {
      const oldFilePath = path.join(
        __dirname,
        "../public",
        card.qr_code_image_path
      );
      try {
        await fs.unlink(oldFilePath);
      } catch (fileError) {
        console.warn("Could not delete old QR code file:", fileError.message);
      }
    }

    // Generate new QR Code data
    const qrData = JSON.stringify({
      cnic: card.cnic,
      cardNumber: card.card_number,
      issuedDate: card.issued_date,
      type: "entry_card",
    });

    // Generate new QR Code image
    const qrFileName = `qr_${card.card_number}_${Date.now()}.png`;
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

    // Update card with new QR code
    await DatabaseHelper.query(
      "UPDATE cards SET qr_code_data = ?, qr_code_image_path = ?, updated_at = NOW() WHERE id = ?",
      [qrData, qrImagePath, id]
    );

    // Update people table as well
    await DatabaseHelper.query(
      "UPDATE people SET qr_code_data = ?, qr_code_image_path = ? WHERE id = ?",
      [qrData, qrImagePath, card.person_id]
    );

    res.json({
      success: true,
      message: "QR code regenerated successfully",
      qr_code_image_path: qrImagePath,
    });
  } catch (error) {
    console.error("Error regenerating QR code:", error);
    res
      .status(500)
      .json({ success: false, message: "Error regenerating QR code" });
  }
};

// Get card statistics
exports.getCardStats = async (req, res) => {
  try {
    const stats = await DatabaseHelper.query(`
      SELECT 
        COUNT(*) as total_cards,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_cards,
        SUM(CASE WHEN status = 'INACTIVE' THEN 1 ELSE 0 END) as inactive_cards,
        SUM(CASE WHEN status = 'LOST' THEN 1 ELSE 0 END) as lost_cards,
        SUM(CASE WHEN status = 'DAMAGED' THEN 1 ELSE 0 END) as damaged_cards,
        COUNT(DISTINCT person_id) as unique_people
      FROM cards
    `);

    const recentCards = await DatabaseHelper.query(`
      SELECT 
        c.card_number,
        p.name as person_name,
        c.issued_date,
        c.status
      FROM cards c
      JOIN people p ON c.person_id = p.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      stats: stats[0],
      recent_cards: recentCards,
    });
  } catch (error) {
    console.error("Error fetching card stats:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching card statistics" });
  }
};

// Scan QR code and get person details
exports.scanQRCode = async (req, res) => {
  try {
    const { qr_data } = req.body;

    let qrInfo;
    try {
      qrInfo = JSON.parse(qr_data);
    } catch (parseError) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid QR code format" });
    }

    // Validate QR code structure
    if (!qrInfo.cnic || !qrInfo.cardNumber || qrInfo.type !== "entry_card") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid entry card QR code" });
    }

    // Find person by CNIC and card number
    const personQuery = `
      SELECT 
        p.*,
        c.name as category_name,
        c.requires_payment,
        cards.status as card_status,
        cards.id as card_id
      FROM people p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN cards ON cards.person_id = p.id
      WHERE p.cnic = ? AND p.card_number = ?
    `;

    const people = await DatabaseHelper.query(personQuery, [
      qrInfo.cnic,
      qrInfo.cardNumber,
    ]);

    if (people.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Person not found or card invalid" });
    }

    const person = people[0];

    // Check if card is active
    if (person.card_status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: `Card is ${person.card_status}. Cannot process entry.`,
      });
    }

    // Update scan count and last scanned time
    await DatabaseHelper.query(
      "UPDATE cards SET scan_count = scan_count + 1, last_scanned_at = NOW() WHERE id = ?",
      [person.card_id]
    );

    res.json({
      success: true,
      person: {
        id: person.id,
        name: person.name,
        cnic: person.cnic,
        phone: person.phone,
        category: person.category_name,
        requires_payment: person.requires_payment,
        card_number: person.card_number,
        is_family_member: person.is_family_member,
      },
      message: "QR code scanned successfully",
    });
  } catch (error) {
    console.error("Error scanning QR code:", error);
    res.status(500).json({ success: false, message: "Error scanning QR code" });
  }
};

module.exports = exports;
