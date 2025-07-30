const DatabaseHelper = require("../config/dbHelper");

// Render reports page
exports.renderReportsPage = async (req, res) => {
  try {
    const categories = await DatabaseHelper.query(
      "SELECT * FROM categories ORDER BY name"
    );
    const facilities = await DatabaseHelper.query(
      "SELECT * FROM facilities WHERE is_active = 1 ORDER BY name"
    );

    res.render("reports", {
      user: req.session.user,
      activePage: "reports",
      title: "Reports & Analytics",
      categories,
      facilities,
      error: req.query.error || null,
      success: req.query.success || null,
    });
  } catch (err) {
    console.error(err);
    res.render("reports", {
      user: req.session.user,
      activePage: "reports",
      title: "Reports & Analytics",
      categories: [],
      facilities: [],
      error: "Error loading reports page",
      success: null,
    });
  }
};

// Daily summary report
exports.getDailySummary = async (req, res) => {
  const { date } = req.query;
  const reportDate = date || new Date().toISOString().split("T")[0];

  try {
    // Total entries and exits for the day
    const entriesExits = await DatabaseHelper.query(
      `
      SELECT 
        COUNT(CASE WHEN entry_type = 'ENTRY' THEN 1 END) as total_entries,
        COUNT(CASE WHEN entry_type = 'EXIT' THEN 1 END) as total_exits,
        SUM(CASE WHEN entry_type = 'ENTRY' THEN total_amount ELSE 0 END) as total_revenue
      FROM entry_logs 
      WHERE DATE(entry_time) = ?
    `,
      [reportDate]
    );

    // Category-wise breakdown
    const categoryBreakdown = await DatabaseHelper.query(
      `
      SELECT 
        c.name as category,
        COUNT(el.id) as entries,
        SUM(el.total_amount) as revenue,
        SUM(CASE WHEN el.is_guest = 1 THEN el.guest_count ELSE 1 END) as total_people
      FROM entry_logs el
      JOIN people p ON el.person_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE DATE(el.entry_time) = ? AND el.entry_type = 'ENTRY'
      GROUP BY c.id, c.name
      ORDER BY entries DESC
    `,
      [reportDate]
    );

    // Facility usage
    const facilityUsage = await DatabaseHelper.query(
      `
      SELECT
        f.name as facility,
        COUNT(ef.id) as usage_count,
        SUM(ef.quantity) as total_quantity,
        SUM(ef.total_price) as total_revenue
      FROM entry_facilities ef
      JOIN facilities f ON ef.facility_id = f.id
      JOIN entry_logs el ON ef.entry_log_id = el.id
      JOIN people p ON el.person_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE DATE(el.entry_time) = ?
      GROUP BY f.id, f.name
      ORDER BY usage_count DESC
    `,
      [reportDate]
    );

    // Current occupancy
    const currentOccupancy = await DatabaseHelper.query(`
      SELECT COUNT(*) as current_people
      FROM entry_logs el
      WHERE el.entry_type = 'ENTRY' AND el.exit_time IS NULL
    `);

    res.json({
      success: true,
      summary: entriesExits[0],
      categoryBreakdown,
      facilityUsage,
      currentOccupancy: currentOccupancy[0].current_people,
      reportDate,
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to generate daily summary" });
  }
};

// Historical report for a specific person
exports.getPersonHistory = async (req, res) => {
  const { query, person_id, start_date, end_date } = req.query;

  try {
    let personInfo;

    if (query) {
      // Search by CNIC or name
      personInfo = await DatabaseHelper.query(
        `
        SELECT p.*, c.name as category_name
        FROM people p
        JOIN categories c ON p.category_id = c.id
        WHERE p.cnic = ? OR p.name LIKE ?
        LIMIT 1
      `,
        [query, `%${query}%`]
      );
    } else if (person_id) {
      // Search by person ID
      personInfo = await DatabaseHelper.query(
        `
        SELECT p.*, c.name as category_name
        FROM people p
        JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `,
        [person_id]
      );
    } else {
      return res.json({
        success: false,
        message: "Please provide a search query or person ID",
      });
    }

    if (personInfo.length === 0) {
      return res.json({ success: false, message: "Person not found" });
    }

    const person = personInfo[0];

    // Entry/Exit history
    let historyQuery = `
      SELECT 
        el.*,
        u.name as operator_name,
        TIMESTAMPDIFF(MINUTE, el.entry_time, el.exit_time) as duration_minutes,
        p.name as person_name,
        p.cnic,
        c.name as category_name
      FROM entry_logs el
      JOIN users u ON el.operator_id = u.id
      JOIN people p ON el.person_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE el.person_id = ?
    `;

    const queryParams = [person.id];

    if (start_date) {
      historyQuery += " AND DATE(el.entry_time) >= ?";
      queryParams.push(start_date);
    }

    if (end_date) {
      historyQuery += " AND DATE(el.entry_time) <= ?";
      queryParams.push(end_date);
    }

    historyQuery += " ORDER BY el.entry_time DESC LIMIT 100";

    const history = await DatabaseHelper.query(historyQuery, queryParams);

    // Get facility usage for each entry
    for (let entry of history) {
      const facilities = await DatabaseHelper.query(
        `
        SELECT ef.*, f.name as facility_name
        FROM entry_facilities ef
        JOIN facilities f ON ef.facility_id = f.id
        WHERE ef.entry_log_id = ?
      `,
        [entry.id]
      );
      entry.facilities = facilities;
    }

    // Summary statistics
    const stats = await DatabaseHelper.query(
      `
      SELECT 
        COUNT(*) as total_visits,
        SUM(total_amount) as total_spent,
        AVG(TIMESTAMPDIFF(MINUTE, entry_time, exit_time)) as avg_duration_minutes,
        MAX(entry_time) as last_visit
      FROM entry_logs 
      WHERE person_id = ? AND entry_type = 'ENTRY'
    `,
      [person_id]
    );

    res.json({
      success: true,
      person: personInfo[0],
      history,
      stats: stats[0],
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to get person history" });
  }
};

// Category-wise report
exports.getCategoryReport = async (req, res) => {
  const { category_id, start_date, end_date } = req.query;

  try {
    let query = `
      SELECT 
        p.name as person_name,
        p.cnic,
        COUNT(el.id) as total_visits,
        SUM(el.total_amount) as total_spent,
        MAX(el.entry_time) as last_visit,
        MIN(el.entry_time) as first_visit
      FROM entry_logs el
      JOIN people p ON el.person_id = p.id
      WHERE el.entry_type = 'ENTRY' AND p.category_id = ?
    `;

    const queryParams = [category_id];

    if (start_date) {
      query += " AND DATE(el.entry_time) >= ?";
      queryParams.push(start_date);
    }

    if (end_date) {
      query += " AND DATE(el.entry_time) <= ?";
      queryParams.push(end_date);
    }

    query += " GROUP BY p.id ORDER BY total_visits DESC";

    const categoryReport = await DatabaseHelper.query(query, queryParams);

    // Get category info
    const categoryInfo = await DatabaseHelper.query(
      "SELECT * FROM categories WHERE id = ?",
      [category_id]
    );

    // Summary stats
    const summary = await DatabaseHelper.query(
      `
      SELECT 
        COUNT(DISTINCT p.id) as unique_people,
        COUNT(el.id) as total_entries,
        SUM(el.total_amount) as total_revenue,
        AVG(el.total_amount) as avg_per_visit
      FROM entry_logs el
      JOIN people p ON el.person_id = p.id
      WHERE el.entry_type = 'ENTRY' AND p.category_id = ?
      ${start_date ? "AND DATE(el.entry_time) >= ?" : ""}
      ${end_date ? "AND DATE(el.entry_time) <= ?" : ""}
    `,
      queryParams
    );

    res.json({
      success: true,
      category: categoryInfo[0],
      report: categoryReport,
      summary: summary[0],
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to generate category report" });
  }
};

// Revenue report
exports.getRevenueReport = async (req, res) => {
  const { period, start_date, end_date } = req.query;

  try {
    let dateFormat,
      dateFilter = "";
    const queryParams = [];

    // Determine date grouping based on period
    switch (period) {
      case "daily":
        dateFormat = "%Y-%m-%d";
        break;
      case "weekly":
        dateFormat = "%Y-%u";
        break;
      case "monthly":
        dateFormat = "%Y-%m";
        break;
      default:
        dateFormat = "%Y-%m-%d";
    }

    if (start_date) {
      dateFilter += " AND DATE(el.entry_time) >= ?";
      queryParams.push(start_date);
    }

    if (end_date) {
      dateFilter += " AND DATE(el.entry_time) <= ?";
      queryParams.push(end_date);
    }

    // Revenue by period
    const revenueByPeriod = await DatabaseHelper.query(
      `
      SELECT 
        DATE_FORMAT(el.entry_time, '${dateFormat}') as period,
        COUNT(el.id) as entries,
        SUM(el.total_amount) as revenue,
        AVG(el.total_amount) as avg_per_entry
      FROM entry_logs el
      WHERE el.entry_type = 'ENTRY' ${dateFilter}
      GROUP BY DATE_FORMAT(el.entry_time, '${dateFormat}')
      ORDER BY period DESC
      LIMIT 30
    `,
      queryParams
    );

    // Revenue by category
    const revenueByCategory = await DatabaseHelper.query(
      `
      SELECT 
        c.name as category,
        COUNT(el.id) as entries,
        SUM(el.total_amount) as revenue
      FROM entry_logs el
      JOIN people p ON el.person_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE el.entry_type = 'ENTRY' ${dateFilter}
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `,
      queryParams
    );

    // Revenue by facility
    const revenueByFacility = await DatabaseHelper.query(
      `
      SELECT 
        f.name as facility,
        COUNT(ef.id) as usage_count,
        SUM(ef.total_price) as revenue
      FROM entry_facilities ef
      JOIN facilities f ON ef.facility_id = f.id
      JOIN entry_logs el ON ef.entry_log_id = el.id
      WHERE 1=1 ${dateFilter}
      GROUP BY f.id, f.name
      ORDER BY revenue DESC
    `,
      queryParams
    );

    res.json({
      success: true,
      revenueByPeriod,
      revenueByCategory,
      revenueByFacility,
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to generate revenue report" });
  }
};

// Export data to CSV
exports.exportData = async (req, res) => {
  const { type, start_date, end_date } = req.query;

  try {
    let query, filename;

    switch (type) {
      case "entries":
        query = `
          SELECT 
            el.id,
            p.name as person_name,
            p.cnic,
            c.name as category,
            el.entry_time,
            el.exit_time,
            el.total_amount,
            el.payment_status,
            el.has_stroller,
            el.vehicle_number,
            u.name as operator_name
          FROM entry_logs el
          JOIN people p ON el.person_id = p.id
          JOIN categories c ON p.category_id = c.id
          JOIN users u ON el.operator_id = u.id
          WHERE el.entry_type = 'ENTRY'
          ${start_date ? "AND DATE(el.entry_time) >= ?" : ""}
          ${end_date ? "AND DATE(el.entry_time) <= ?" : ""}
          ORDER BY el.entry_time DESC
        `;
        filename = "entries_export.csv";
        break;

      case "people":
        query = `
          SELECT 
            p.id,
            p.name,
            p.cnic,
            p.phone,
            p.address,
            c.name as category,
            p.created_at
          FROM people p
          JOIN categories c ON p.category_id = c.id
          WHERE p.is_active = 1
          ORDER BY p.name
        `;
        filename = "people_export.csv";
        break;

      default:
        return res.json({ success: false, message: "Invalid export type" });
    }

    const params = [];
    if (start_date && type === "entries") params.push(start_date);
    if (end_date && type === "entries") params.push(end_date);

    const data = await DatabaseHelper.query(query, params);

    if (data.length === 0) {
      return res.json({ success: false, message: "No data to export" });
    }

    // Convert to CSV
    const headers = Object.keys(data[0]);
    let csv = headers.join(",") + "\n";

    data.forEach((row) => {
      const values = headers.map((header) => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (
          typeof value === "string" &&
          (value.includes(",") || value.includes('"'))
        ) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || "";
      });
      csv += values.join(",") + "\n";
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Export failed" });
  }
};
