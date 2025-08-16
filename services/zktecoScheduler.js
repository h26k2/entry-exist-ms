const cron = require("node-cron");
const ZKTecoService = require("./zktecoService");
const DatabaseHelper = require("../config/dbHelper");

class ZKTecoScheduler {
  constructor() {
    this.zktecoService = new ZKTecoService();
    this.isRunning = false;
    this.jobs = [];
  }

  /**
   * Initialize and start all scheduled tasks
   */
  async initialize() {
    try {
      console.log("🔄 Initializing ZKTeco scheduler...");

      // Check if auto-sync is enabled
      const autoSyncEnabled = await this.getConfigValue("auto_sync_enabled");
      if (autoSyncEnabled === "true") {
        await this.startScheduledTasks();
      }

      this.isRunning = true;
      console.log("✅ ZKTeco scheduler initialized");
    } catch (error) {
      console.error("❌ Failed to initialize ZKTeco scheduler:", error.message);
    }
  }

  /**
   * Start all scheduled tasks
   */
  async startScheduledTasks() {
    try {
      // Get sync interval from config
      const syncInterval =
        (await this.getConfigValue("sync_interval_minutes")) || "5";
      const cronExpression = `*/${syncInterval} * * * *`; // Every X minutes

      // Schedule entry/exit sync to ZKTeco
      const entrySyncJob = cron.schedule(
        cronExpression,
        async () => {
          await this.syncUnsyncedEntries();
        },
        {
          scheduled: false,
        }
      );

      // Schedule attendance pull from ZKTeco (every 10 minutes)
      const attendancePullJob = cron.schedule(
        "*/10 * * * *",
        async () => {
          await this.pullRecentAttendance();
        },
        {
          scheduled: false,
        }
      );

      // Schedule people sync (once per hour)
      const peopleSyncJob = cron.schedule(
        "0 * * * *",
        async () => {
          await this.syncNewPeople();
        },
        {
          scheduled: false,
        }
      );

      // Start jobs
      entrySyncJob.start();
      attendancePullJob.start();
      peopleSyncJob.start();

      this.jobs = [
        { name: "Entry Sync", job: entrySyncJob },
        { name: "Attendance Pull", job: attendancePullJob },
        { name: "People Sync", job: peopleSyncJob },
      ];

      console.log(
        `✅ ZKTeco scheduled tasks started (sync interval: ${syncInterval} minutes)`
      );
    } catch (error) {
      console.error("❌ Failed to start scheduled tasks:", error.message);
    }
  }

  /**
   * Stop all scheduled tasks
   */
  stopScheduledTasks() {
    this.jobs.forEach(({ name, job }) => {
      job.destroy();
      console.log(`🛑 Stopped ${name} job`);
    });
    this.jobs = [];
    console.log("✅ All ZKTeco scheduled tasks stopped");
  }

  /**
   * Sync unsynced entries to ZKTeco
   */
  async syncUnsyncedEntries() {
    try {
      console.log("🔄 Running scheduled entry sync...");

      const unsyncedEntries = await DatabaseHelper.query(`
        SELECT el.id, el.person_id, p.name
        FROM entry_logs el
        JOIN people p ON el.person_id = p.id
        WHERE (el.zkteco_synced IS NULL OR el.zkteco_synced = 0)
        AND p.zkteco_employee_id IS NOT NULL
        AND el.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ORDER BY el.created_at DESC
        LIMIT 50
      `);

      let successCount = 0;
      let failureCount = 0;

      for (const entry of unsyncedEntries) {
        try {
          await this.zktecoService.syncEntryExitToZKTeco(entry.id);
          successCount++;

          // Log successful sync
          await this.logSync("ENTRY", entry.id, null, "SUCCESS", null);
        } catch (error) {
          failureCount++;

          // Log failed sync
          await this.logSync("ENTRY", entry.id, null, "FAILED", error.message);
          console.error(
            `Failed to sync entry ${entry.id} for ${entry.name}:`,
            error.message
          );
        }
      }

      if (unsyncedEntries.length > 0) {
        console.log(
          `✅ Entry sync completed: ${successCount} success, ${failureCount} failed`
        );
      }
    } catch (error) {
      console.error("❌ Scheduled entry sync failed:", error.message);
    }
  }

  /**
   * Pull recent attendance from ZKTeco
   */
  async pullRecentAttendance() {
    try {
      console.log("🔄 Running scheduled attendance pull...");

      // Get last pull timestamp
      const lastPull = await this.getConfigValue("last_attendance_pull");
      const pullEnabled = await this.getConfigValue("pull_attendance_enabled");

      if (pullEnabled !== "true") {
        return;
      }

      const startDate = lastPull
        ? new Date(lastPull)
        : new Date(Date.now() - 60 * 60 * 1000); // Last hour
      const endDate = new Date();

      const processedCount = await this.zktecoService.pullAttendanceFromZKTeco(
        startDate.toISOString(),
        endDate.toISOString()
      );

      // Update last pull timestamp
      await this.setConfigValue("last_attendance_pull", endDate.toISOString());

      if (processedCount > 0) {
        console.log(
          `✅ Attendance pull completed: ${processedCount} records processed`
        );
      }
    } catch (error) {
      console.error("❌ Scheduled attendance pull failed:", error.message);
    }
  }

  /**
   * Sync new people to ZKTeco
   */
  async syncNewPeople() {
    try {
      console.log("🔄 Running scheduled people sync...");

      const unsyncedPeople = await DatabaseHelper.query(`
        SELECT * FROM people 
        WHERE is_active = 1 
        AND zkteco_employee_id IS NULL 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ORDER BY created_at DESC
        LIMIT 20
      `);

      let successCount = 0;
      let failureCount = 0;

      for (const person of unsyncedPeople) {
        try {
          await this.zktecoService.syncPersonToZKTeco(person.id);
          successCount++;

          // Log successful sync
          await this.logSync("PERSON", person.id, null, "SUCCESS", null);
        } catch (error) {
          failureCount++;

          // Log failed sync
          await this.logSync(
            "PERSON",
            person.id,
            null,
            "FAILED",
            error.message
          );
          console.error(`Failed to sync person ${person.name}:`, error.message);
        }
      }

      if (unsyncedPeople.length > 0) {
        console.log(
          `✅ People sync completed: ${successCount} success, ${failureCount} failed`
        );
      }
    } catch (error) {
      console.error("❌ Scheduled people sync failed:", error.message);
    }
  }

  /**
   * Log sync operation
   */
  async logSync(
    syncType,
    localRecordId,
    zktecoRecordId,
    syncStatus,
    errorMessage
  ) {
    try {
      await DatabaseHelper.query(
        `
        INSERT INTO zkteco_sync_logs (sync_type, local_record_id, zkteco_record_id, sync_status, error_message)
        VALUES (?, ?, ?, ?, ?)
      `,
        [syncType, localRecordId, zktecoRecordId, syncStatus, errorMessage]
      );
    } catch (error) {
      console.error("Failed to log sync operation:", error.message);
    }
  }

  /**
   * Get configuration value
   */
  async getConfigValue(key) {
    try {
      const results = await DatabaseHelper.query(
        "SELECT config_value FROM zkteco_config WHERE config_key = ?",
        [key]
      );
      return results.length > 0 ? results[0].config_value : null;
    } catch (error) {
      console.error(`Failed to get config value for ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Set configuration value
   */
  async setConfigValue(key, value) {
    try {
      await DatabaseHelper.query(
        `
        INSERT INTO zkteco_config (config_key, config_value) 
        VALUES (?, ?) 
        ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
      `,
        [key, value]
      );
    } catch (error) {
      console.error(`Failed to set config value for ${key}:`, error.message);
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats() {
    try {
      const stats = await DatabaseHelper.query(`
        SELECT 
          sync_type,
          sync_status,
          COUNT(*) as count,
          DATE(sync_timestamp) as sync_date
        FROM zkteco_sync_logs 
        WHERE sync_timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY sync_type, sync_status, DATE(sync_timestamp)
        ORDER BY sync_timestamp DESC
      `);

      return stats;
    } catch (error) {
      console.error("Failed to get sync stats:", error.message);
      return [];
    }
  }

  /**
   * Enable auto-sync
   */
  async enableAutoSync(intervalMinutes = 5) {
    try {
      await this.setConfigValue("auto_sync_enabled", "true");
      await this.setConfigValue(
        "sync_interval_minutes",
        intervalMinutes.toString()
      );

      if (this.isRunning) {
        this.stopScheduledTasks();
        await this.startScheduledTasks();
      }

      console.log(
        `✅ Auto-sync enabled with ${intervalMinutes} minute interval`
      );
    } catch (error) {
      console.error("Failed to enable auto-sync:", error.message);
      throw error;
    }
  }

  /**
   * Disable auto-sync
   */
  async disableAutoSync() {
    try {
      await this.setConfigValue("auto_sync_enabled", "false");
      this.stopScheduledTasks();

      console.log("✅ Auto-sync disabled");
    } catch (error) {
      console.error("Failed to disable auto-sync:", error.message);
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: this.jobs.length,
      jobs: this.jobs.map(({ name }) => name),
    };
  }
}

module.exports = ZKTecoScheduler;
