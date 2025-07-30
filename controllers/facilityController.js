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

    // Average price
    const avgPriceResult = await DatabaseHelper.query(
      "SELECT AVG(price) as avg FROM facilities"
    );
    const avgPrice = avgPriceResult[0].avg
      ? parseFloat(avgPriceResult[0].avg).toFixed(2)
      : 0;

    // Revenue today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const todayRevenueResult = await DatabaseHelper.query(
      `SELECT SUM(ef.total_price) as revenue FROM entry_facilities ef JOIN entry_logs el ON ef.entry_log_id = el.id WHERE el.created_at >= ? AND el.created_at < ?`,
      [today, tomorrow]
    );
    const todayRevenue = todayRevenueResult[0].revenue
      ? parseFloat(todayRevenueResult[0].revenue).toFixed(2)
      : 0;

    res.json({
      success: true,
      totalFacilities,
      activeFacilities,
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
    // Check if facility is being used in any entries
    const usageCount = await DatabaseHelper.query(
      "SELECT COUNT(*) as count FROM entry_facilities WHERE facility_id = ?",
      [id]
    );

    if (usageCount[0].count > 0) {
      return res.json({
        success: false,
        message:
          "Cannot delete facility that has been used in entries. You can deactivate it instead.",
      });
    }

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

    // Get usage statistics
    const usageStats = await DatabaseHelper.query(
      `
      SELECT 
        COUNT(*) as total_usage,
        SUM(quantity) as total_quantity,
        SUM(total_price) as total_revenue,
        MAX(ef.created_at) as last_used
      FROM entry_facilities ef
      JOIN entry_logs el ON ef.entry_log_id = el.id
      WHERE ef.facility_id = ?
    `,
      [id]
    );

    res.json({
      success: true,
      facility: facility[0],
      stats: usageStats[0],
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
    let query = `
      SELECT 
        f.id,
        f.name,
        f.price,
        COUNT(ef.id) as usage_count,
        SUM(ef.quantity) as total_quantity,
        SUM(ef.total_price) as total_revenue,
        AVG(ef.unit_price) as avg_price
      FROM facilities f
      LEFT JOIN entry_facilities ef ON f.id = ef.facility_id
      LEFT JOIN entry_logs el ON ef.entry_log_id = el.id
      WHERE f.is_active = 1
    `;

    const params = [];

    if (start_date) {
      query += " AND DATE(el.entry_time) >= ?";
      params.push(start_date);
    }

    if (end_date) {
      query += " AND DATE(el.entry_time) <= ?";
      params.push(end_date);
    }

    query += " GROUP BY f.id, f.name, f.price ORDER BY total_revenue DESC";

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
