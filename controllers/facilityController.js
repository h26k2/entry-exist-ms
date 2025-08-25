// Facility stats API for dashboard
exports.getFacilityStats = async (req, res) => {
  try {
    // Total facilities
    const totalFacilitiesResult = await DatabaseHelper.query(
      "SELECT COUNT(*) as total FROM facilities"
    );
    const totalFacilities = totalFacilitiesResult[0].total || 0;

    // Active facilities
    const activeFacilitiesResult = await DatabaseHelper.query(
      "SELECT COUNT(*) as active FROM facilities WHERE is_active = 1"
    );
    const activeFacilities = activeFacilitiesResult[0].active || 0;

    // Inactive facilities
    const inactiveFacilitiesResult = await DatabaseHelper.query(
      "SELECT COUNT(*) as inactive FROM facilities WHERE is_active = 0"
    );
    const inactiveFacilities = inactiveFacilitiesResult[0].inactive || 0;

    // Average price
    const avgPriceResult = await DatabaseHelper.query(
      "SELECT AVG(price) as avg FROM facilities"
    );
    const avgPrice = avgPriceResult[0].avg
      ? parseFloat(avgPriceResult[0].avg).toFixed(2)
      : 0;

    // Revenue today - removing as entry_facilities table is removed
    const todayRevenue = 0;

    res.json({
      success: true,
      totalFacilities,
      activeFacilities,
      inactiveFacilities,
      avgPrice,
      todayRevenue,
    });
  } catch (err) {
    console.error("Error loading facility stats:", err);
    res
      .status(500)
      .json({ success: false, message: "Error loading facility stats" });
  }
};
const DatabaseHelper = require("../config/dbHelper");

// Render facility management page
exports.renderFacilityPage = async (req, res) => {
  try {
    const facilities = await DatabaseHelper.query(
      "SELECT * FROM facilities ORDER BY name"
    );

    res.render("facility-management", {
      user: req.session.user,
      activePage: "facilities",
      title: "Facility Management",
      facilities,
      error: req.query.error || null,
      success: req.query.success || null,
    });
  } catch (err) {
    console.error(err);
    res.render("facility-management", {
      user: req.session.user,
      activePage: "facilities",
      title: "Facility Management",
      facilities: [],
      error: "Error loading facilities page",
      success: null,
    });
  }
};

// Add new facility
exports.addFacility = async (req, res) => {
  const { name, price, description, is_active } = req.body;

  try {
    await DatabaseHelper.execute(
      `
      INSERT INTO facilities (name, price, description, is_active)
      VALUES (?, ?, ?, ?)
    `,
      [name, parseFloat(price) || 0.0, description || null, is_active === "1"]
    );

    res.json({
      success: true,
      message: "Facility added successfully",
    });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      res.json({ success: false, message: "Facility name already exists" });
    } else {
      res.json({ success: false, message: "Failed to add facility" });
    }
  }
};

// Update facility
exports.updateFacility = async (req, res) => {
  const { id } = req.params;
  const { name, price, description, is_active } = req.body;

  try {
    await DatabaseHelper.execute(
      `
      UPDATE facilities 
      SET name = ?, price = ?, description = ?, is_active = ?
      WHERE id = ?
    `,
      [
        name,
        parseFloat(price) || 0.0,
        description || null,
        is_active === "1",
        id,
      ]
    );

    res.json({ success: true, message: "Facility updated successfully" });
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      res.json({ success: false, message: "Facility name already exists" });
    } else {
      res.json({ success: false, message: "Failed to update facility" });
    }
  }
};

// Delete facility
exports.deleteFacility = async (req, res) => {
  const { id } = req.params;

  try {
    // Remove usage check as entry_facilities table is removed
    await DatabaseHelper.execute("DELETE FROM facilities WHERE id = ?", [id]);

    res.json({ success: true, message: "Facility deleted successfully" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to delete facility" });
  }
};

// Get facility details
exports.getFacilityDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const facility = await DatabaseHelper.query(
      "SELECT * FROM facilities WHERE id = ?",
      [id]
    );

    if (facility.length === 0) {
      return res.json({ success: false, message: "Facility not found" });
    }

    // Remove usage stats as entry_facilities table is removed
    const usageStats = {
      total_usage: 0,
      total_quantity: 0,
      total_revenue: 0,
      last_used: null
    };

    res.json({
      success: true,
      facility: facility[0],
      stats: usageStats,
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to get facility details" });
  }
};

// Toggle facility status
exports.toggleFacilityStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const facility = await DatabaseHelper.query(
      "SELECT is_active FROM facilities WHERE id = ?",
      [id]
    );

    if (facility.length === 0) {
      return res.json({ success: false, message: "Facility not found" });
    }

    const newStatus = !facility[0].is_active;

    await DatabaseHelper.execute(
      "UPDATE facilities SET is_active = ? WHERE id = ?",
      [newStatus, id]
    );

    res.json({
      success: true,
      message: `Facility ${
        newStatus ? "activated" : "deactivated"
      } successfully`,
      is_active: newStatus,
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to toggle facility status" });
  }
};

// Get facility usage report
exports.getFacilityUsageReport = async (req, res) => {
  const { start_date, end_date } = req.query;

  try {
    // Remove facility usage statistics as entry_facilities table is removed
    let query = `
      SELECT 
        f.id,
        f.name,
        f.price,
        0 as usage_count,
        0 as total_quantity,
        0 as total_revenue,
        f.price as avg_price
      FROM facilities f
      WHERE f.is_active = 1
    `;

    const params = [];

    // Remove date filtering as entry_facilities table is removed

    query += " ORDER BY f.name ASC";

    const report = await DatabaseHelper.query(query, params);

    res.json({
      success: true,
      report,
      period: {
        start_date: start_date || "All time",
        end_date: end_date || "All time",
      },
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to generate usage report" });
  }
};
