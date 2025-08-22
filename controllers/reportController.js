const DatabaseHelper = require("../config/dbHelper");
const { createAuthenticatedClient } = require('../utils/zkbiotime');

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
    // Fetch all transactions from ZKBioTime API for the given date
    const client = await createAuthenticatedClient();
    const response = await client.get(`/iclock/api/transactions/?start_time=${reportDate} 00:00:00&end_time=${reportDate} 23:59:59&page_size=1000`);
    const data = response.data.data || [];
    // Calculate summary
    const total_entries = data.filter(e => e.punch_state_display === 'Check In').length;
    const total_exits = data.filter(e => e.punch_state_display === 'Check Out').length;
    // No revenue field in ZKBioTime, so set to 0
    const total_revenue = 0;
    // Category breakdown not available, set empty
    const categoryBreakdown = [];
    // Facility usage not available, set empty
    const facilityUsage = [];
    // Current occupancy: count of last Check In without Check Out
    const currentOccupancy = total_entries - total_exits;
    res.json({
      success: true,
      summary: { total_entries, total_exits, total_revenue },
      categoryBreakdown,
      facilityUsage,
      currentOccupancy,
      reportDate,
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to generate daily summary" });
  }
};

// Historical report for a specific person
exports.getPersonHistory = async (req, res) => {
  const { emp_code, start_date, end_date } = req.query;
  try {
    if (!emp_code) {
      return res.json({ success: false, message: "Please provide emp_code" });
    }
    const client = await createAuthenticatedClient();
    let url = `/iclock/api/transactions/?emp_code=${emp_code}`;
    if (start_date) url += `&start_time=${start_date} 00:00:00`;
    if (end_date) url += `&end_time=${end_date} 23:59:59`;
    url += `&page_size=1000`;
    const response = await client.get(url);
    const history = response.data.data || [];
    // Basic stats
    const total_visits = history.length;
    const last_visit = history.length > 0 ? history[0].punch_time : null;
    res.json({
      success: true,
      history,
      stats: { total_visits, last_visit },
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to get person history" });
  }
};

// Category-wise report
exports.getCategoryReport = async (req, res) => {
  const { terminal_alias, start_date, end_date } = req.query;
  try {
    if (!terminal_alias) {
      return res.json({ success: false, message: "Please provide terminal_alias" });
    }
    const client = await createAuthenticatedClient();
    let url = `/iclock/api/transactions/?terminal_alias=${terminal_alias}`;
    if (start_date) url += `&start_time=${start_date} 00:00:00`;
    if (end_date) url += `&end_time=${end_date} 23:59:59`;
    url += `&page_size=1000`;
    const response = await client.get(url);
    const report = response.data.data || [];
    const total_entries = report.length;
    res.json({
      success: true,
      report,
      summary: { total_entries },
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to generate category report" });
  }
};

// Revenue report
exports.getRevenueReport = async (req, res) => {
  const { start_date, end_date } = req.query;
  try {
    const client = await createAuthenticatedClient();
    let url = `/iclock/api/transactions/?`;
    if (start_date) url += `start_time=${start_date} 00:00:00&`;
    if (end_date) url += `end_time=${end_date} 23:59:59&`;
    url += `page_size=1000`;
    const response = await client.get(url);
    const data = response.data.data || [];
    // No revenue field, so just count entries
    const total_entries = data.length;
    res.json({
      success: true,
      total_entries,
      data,
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to generate revenue report" });
  }
};

// Export data to CSV
exports.exportData = async (req, res) => {
  const { start_date, end_date } = req.query;
  try {
    const client = await createAuthenticatedClient();
    let url = `/iclock/api/transactions/?`;
    if (start_date) url += `start_time=${start_date} 00:00:00&`;
    if (end_date) url += `end_time=${end_date} 23:59:59&`;
    url += `page_size=1000`;
    const response = await client.get(url);
    const data = response.data.data || [];
    if (data.length === 0) {
      return res.json({ success: false, message: "No data to export" });
    }
    // Convert to CSV
    const headers = Object.keys(data[0]);
    let csv = headers.join(",") + "\n";
    data.forEach((row) => {
      const values = headers.map((header) => {
        const value = row[header];
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
    res.setHeader("Content-Disposition", `attachment; filename="entries_export.csv"`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Export failed" });
  }
};

// API for today's check-ins and check-outs
exports.getTodayCheckinCheckout = async (req, res) => {
  function formatDate(date, hour, minute, second) {
    // Returns YYYY-MM-DD HH:mm:ss
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:${String(second).padStart(2,'0')}`;
  }
  try {
    const today = new Date();
    const start = formatDate(today, 0, 0, 0); // 12:00am
    const end = formatDate(today, 23, 59, 59); // 11:59pm
    const client = await require('../utils/zkbiotime').createAuthenticatedClient();
    const response = await client.get(`/iclock/api/transactions/?start_time=${start}&end_time=${end}&page_size=1000`);
    const data = response.data.data || [];
    const checkins = data.filter(e => e.punch_state_display === 'Check In');
    const checkouts = data.filter(e => e.punch_state_display === 'Check Out');
    res.json({
      success: true,
      checkins,
      checkouts,
      total_checkins: checkins.length,
      total_checkouts: checkouts.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch today's check-ins/check-outs" });
  }
};

// API for today's recent activities from ZKBioTime
exports.getTodayRecentActivities = async (req, res) => {
  function formatDate(date, hour, minute, second) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:${String(second).padStart(2,'0')}`;
  }
  try {
    const today = new Date();
    const start = formatDate(today, 0, 0, 0);
    const end = formatDate(today, 23, 59, 59);
    const client = await require('../utils/zkbiotime').createAuthenticatedClient();
    const response = await client.get(`/iclock/api/transactions/?start_time=${start}&end_time=${end}&page_size=100`);
    const data = response.data.data || [];
    // Sort by punch_time descending (latest first)
    data.sort((a, b) => new Date(b.punch_time) - new Date(a.punch_time));
    // Map to activity format for dashboard
    const activities = data.map(e => ({
      name: `${e.first_name || ''} ${e.last_name || ''}`.trim(),
      cnic: e.cnic || '',
      entry_type: e.punch_state_display === 'Check In' ? 'ENTRY' : 'EXIT',
      entry_time: e.punch_state_display === 'Check In' ? e.punch_time : null,
      exit_time: e.punch_state_display === 'Check Out' ? e.punch_time : null,
      remarks: e.remarks || ''
    }));
    res.json({ success: true, activities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch today's recent activities" });
  }
};
