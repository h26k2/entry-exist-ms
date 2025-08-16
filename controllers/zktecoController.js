const ZKTecoService = require("../services/zktecoService");
const DatabaseHelper = require("../config/dbHelper");

const zktecoService = new ZKTecoService();

// Render ZKTeco integration page
exports.renderZKTecoPage = async (req, res) => {
  try {
    // Get sync statistics
    const syncStats = await DatabaseHelper.query(`
      SELECT 
        COUNT(*) as total_people,
        SUM(CASE WHEN zkteco_employee_id IS NOT NULL THEN 1 ELSE 0 END) as synced_people,
        COUNT(*) - SUM(CASE WHEN zkteco_employee_id IS NOT NULL THEN 1 ELSE 0 END) as unsynced_people
      FROM people WHERE is_active = 1
    `);

    const entryStats = await DatabaseHelper.query(`
      SELECT 
        COUNT(*) as total_entries,
        SUM(CASE WHEN zkteco_synced = 1 THEN 1 ELSE 0 END) as synced_entries,
        COUNT(*) - SUM(CASE WHEN zkteco_synced = 1 THEN 1 ELSE 0 END) as unsynced_entries
      FROM entry_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    res.render("zkteco-integration", {
      user: req.session.user,
      activePage: "zkteco",
      title: "ZKTeco Integration",
      syncStats: syncStats[0] || {},
      entryStats: entryStats[0] || {},
      error: req.query.error || null,
      success: req.query.success || null,
    });
  } catch (err) {
    console.error("Error rendering ZKTeco page:", err);
    res.render("zkteco-integration", {
      user: req.session.user,
      activePage: "zkteco",
      title: "ZKTeco Integration",
      syncStats: {},
      entryStats: {},
      error: "Error loading ZKTeco integration page",
      success: null,
    });
  }
};

// Test ZKTeco connection
exports.testConnection = async (req, res) => {
  try {
    const result = await zktecoService.testConnection();
    res.json(result);
  } catch (error) {
    res.json({
      success: false,
      message: `Connection test failed: ${error.message}`,
    });
  }
};

// Sync all people to ZKTeco
exports.syncAllPeople = async (req, res) => {
  try {
    const people = await DatabaseHelper.query(
      "SELECT * FROM people WHERE is_active = 1 AND zkteco_employee_id IS NULL"
    );

    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    for (const person of people) {
      try {
        await zktecoService.syncPersonToZKTeco(person.id);
        successCount++;
      } catch (error) {
        failureCount++;
        errors.push(`${person.name}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Sync completed. Success: ${successCount}, Failed: ${failureCount}`,
      successCount,
      failureCount,
      errors: errors.slice(0, 10), // Limit errors shown
    });
  } catch (error) {
    res.json({
      success: false,
      message: `Bulk sync failed: ${error.message}`,
    });
  }
};

// Sync specific person to ZKTeco
exports.syncPerson = async (req, res) => {
  try {
    const { person_id } = req.body;
    await zktecoService.syncPersonToZKTeco(person_id);

    res.json({
      success: true,
      message: "Person synced successfully to ZKTeco",
    });
  } catch (error) {
    res.json({
      success: false,
      message: `Sync failed: ${error.message}`,
    });
  }
};

// Sync unsynced entries to ZKTeco
exports.syncUnsyncedEntries = async (req, res) => {
  try {
    const unsyncedEntries = await DatabaseHelper.query(`
      SELECT el.id 
      FROM entry_logs el
      JOIN people p ON el.person_id = p.id
      WHERE (el.zkteco_synced IS NULL OR el.zkteco_synced = 0)
      AND p.zkteco_employee_id IS NOT NULL
      ORDER BY el.created_at DESC
      LIMIT 100
    `);

    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    for (const entry of unsyncedEntries) {
      try {
        await zktecoService.syncEntryExitToZKTeco(entry.id);
        successCount++;
      } catch (error) {
        failureCount++;
        errors.push(`Entry ${entry.id}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Entry sync completed. Success: ${successCount}, Failed: ${failureCount}`,
      successCount,
      failureCount,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    res.json({
      success: false,
      message: `Entry sync failed: ${error.message}`,
    });
  }
};

// Pull attendance from ZKTeco
exports.pullAttendance = async (req, res) => {
  try {
    const { start_date, end_date } = req.body;

    const startDate = start_date ? new Date(start_date).toISOString() : null;
    const endDate = end_date ? new Date(end_date).toISOString() : null;

    const processedCount = await zktecoService.pullAttendanceFromZKTeco(
      startDate,
      endDate
    );

    res.json({
      success: true,
      message: `Successfully pulled and processed ${processedCount} attendance records`,
      processedCount,
    });
  } catch (error) {
    res.json({
      success: false,
      message: `Pull attendance failed: ${error.message}`,
    });
  }
};

// Get ZKTeco employees
exports.getZKTecoEmployees = async (req, res) => {
  try {
    const employees = await zktecoService.getEmployees();
    res.json({
      success: true,
      employees: employees.slice(0, 50), // Limit to 50 for performance
    });
  } catch (error) {
    res.json({
      success: false,
      message: `Failed to fetch employees: ${error.message}`,
    });
  }
};

// Get ZKTeco attendance transactions
exports.getZKTecoTransactions = async (req, res) => {
  try {
    const { start_date, end_date, emp_code } = req.query;

    const transactions = await zktecoService.getTransactions(
      start_date,
      end_date,
      emp_code
    );
    res.json({
      success: true,
      transactions: transactions.slice(0, 100), // Limit to 100 for performance
    });
  } catch (error) {
    res.json({
      success: false,
      message: `Failed to fetch transactions: ${error.message}`,
    });
  }
};

// Manual entry/exit sync
exports.manualEntrySync = async (req, res) => {
  try {
    const { person_id, entry_type, timestamp } = req.body;

    // Get person data
    const persons = await DatabaseHelper.query(
      "SELECT * FROM people WHERE id = ?",
      [person_id]
    );

    if (persons.length === 0) {
      return res.json({
        success: false,
        message: "Person not found",
      });
    }

    const person = persons[0];

    // Push transaction to ZKTeco
    await zktecoService.pushTransaction({
      emp_code: person.cnic,
      punch_time: new Date(timestamp).toISOString(),
      punch_state: entry_type === "ENTRY" ? 0 : 1,
      verify_type: 3, // Manual entry
      work_code: entry_type,
      terminal_sn: "MANUAL_ENTRY",
    });

    res.json({
      success: true,
      message: `Manual ${entry_type.toLowerCase()} synced to ZKTeco successfully`,
    });
  } catch (error) {
    res.json({
      success: false,
      message: `Manual sync failed: ${error.message}`,
    });
  }
};

// Get sync status
exports.getSyncStatus = async (req, res) => {
  try {
    const peopleStats = await DatabaseHelper.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN zkteco_employee_id IS NOT NULL THEN 1 ELSE 0 END) as synced,
        COUNT(*) - SUM(CASE WHEN zkteco_employee_id IS NOT NULL THEN 1 ELSE 0 END) as unsynced
      FROM people WHERE is_active = 1
    `);

    const entryStats = await DatabaseHelper.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN zkteco_synced = 1 THEN 1 ELSE 0 END) as synced,
        COUNT(*) - SUM(CASE WHEN zkteco_synced = 1 THEN 1 ELSE 0 END) as unsynced
      FROM entry_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);

    res.json({
      success: true,
      people: peopleStats[0] || {},
      entries: entryStats[0] || {},
    });
  } catch (error) {
    res.json({
      success: false,
      message: `Failed to get sync status: ${error.message}`,
    });
  }
};

module.exports = exports;
