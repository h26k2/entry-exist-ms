const axios = require("axios");
const DatabaseHelper = require("../config/dbHelper");

class ZKTecoService {
  constructor() {
    this.baseURL = process.env.ZKTECO_BASE_URL || "http://localhost:8000";
    this.username = process.env.ZKTECO_USERNAME || "admin";
    this.password = process.env.ZKTECO_PASSWORD || "admin";
    this.token = null;
    this.tokenExpiry = null;
  }

  /**
   * Authenticate with ZKTeco BioTime server
   */
  async authenticate() {
    try {
      const response = await axios.post(
        `${this.baseURL}/jwt-api-token-auth/`,
        {
          username: this.username,
          password: this.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      this.token = response.data.token;
      // Token typically expires in 24 hours
      this.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      console.log("✅ Successfully authenticated with ZKTeco BioTime");
      return this.token;
    } catch (error) {
      console.error("❌ ZKTeco Authentication failed:", error.message);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Get valid authentication token
   */
  async getValidToken() {
    if (!this.token || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
      await this.authenticate();
    }
    return this.token;
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(endpoint, method = "GET", data = null) {
    const token = await this.getValidToken();

    const config = {
      method,
      url: `${this.baseURL}${endpoint}`,
      headers: {
        Authorization: `JWT ${token}`,
        "Content-Type": "application/json",
      },
    };

    if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(
        `❌ ZKTeco API request failed (${method} ${endpoint}):`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Get all employees from ZKTeco BioTime
   */
  async getEmployees() {
    try {
      const response = await this.makeRequest("/personnel/api/employees/");
      return response.data || response;
    } catch (error) {
      console.error("Failed to fetch employees:", error.message);
      return [];
    }
  }

  /**
   * Create employee in ZKTeco BioTime
   */
  async createEmployee(employeeData) {
    try {
      const zkEmployee = {
        emp_code: employeeData.emp_code || employeeData.cnic,
        first_name: employeeData.first_name || employeeData.name.split(" ")[0],
        last_name:
          employeeData.last_name ||
          employeeData.name.split(" ").slice(1).join(" ") ||
          "",
        email: employeeData.email || `${employeeData.cnic}@example.com`,
        mobile: employeeData.mobile || employeeData.phone || "",
        department: employeeData.department || 1, // Default department
        position: employeeData.position || 1, // Default position
        hire_date:
          employeeData.hire_date || new Date().toISOString().split("T")[0],
        is_active: true,
      };

      const response = await this.makeRequest(
        "/personnel/api/employees/",
        "POST",
        zkEmployee
      );
      console.log(`✅ Employee created in ZKTeco: ${employeeData.name}`);
      return response;
    } catch (error) {
      console.error(
        `❌ Failed to create employee in ZKTeco: ${employeeData.name}`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Update employee in ZKTeco BioTime
   */
  async updateEmployee(employeeId, employeeData) {
    try {
      const response = await this.makeRequest(
        `/personnel/api/employees/${employeeId}/`,
        "PUT",
        employeeData
      );
      console.log(
        `✅ Employee updated in ZKTeco: ${employeeData.first_name} ${employeeData.last_name}`
      );
      return response;
    } catch (error) {
      console.error(
        `❌ Failed to update employee in ZKTeco: ${employeeId}`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Get attendance transactions from ZKTeco BioTime
   */
  async getTransactions(startDate = null, endDate = null, employeeId = null) {
    try {
      let endpoint = "/iclock/api/transactions/";
      const params = new URLSearchParams();

      if (startDate) {
        params.append("start_time", startDate);
      }
      if (endDate) {
        params.append("end_time", endDate);
      }
      if (employeeId) {
        params.append("emp_code", employeeId);
      }

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      const response = await this.makeRequest(endpoint);
      return response.data || response;
    } catch (error) {
      console.error("Failed to fetch transactions:", error.message);
      return [];
    }
  }

  /**
   * Push attendance transaction to ZKTeco BioTime
   */
  async pushTransaction(transactionData) {
    try {
      const zkTransaction = {
        emp_code: transactionData.emp_code,
        punch_time: transactionData.punch_time,
        punch_state: transactionData.punch_state, // 0=Check In, 1=Check Out, 2=Break Out, 3=Break In
        verify_type: transactionData.verify_type || 1, // 1=Fingerprint, 2=Face, 3=Card, 4=Password
        work_code: transactionData.work_code || "",
        terminal_sn: transactionData.terminal_sn || "NODEJS_SERVER",
        terminal_alias:
          transactionData.terminal_alias || "Entry Management System",
      };

      const response = await this.makeRequest(
        "/iclock/api/transactions/",
        "POST",
        zkTransaction
      );
      console.log(
        `✅ Transaction pushed to ZKTeco: ${transactionData.emp_code} at ${transactionData.punch_time}`
      );
      return response;
    } catch (error) {
      console.error(`❌ Failed to push transaction to ZKTeco:`, error.message);
      throw error;
    }
  }

  /**
   * Get departments from ZKTeco BioTime
   */
  async getDepartments() {
    try {
      const response = await this.makeRequest("/personnel/api/departments/");
      return response.data || response;
    } catch (error) {
      console.error("Failed to fetch departments:", error.message);
      return [];
    }
  }

  /**
   * Sync person from local database to ZKTeco BioTime
   */
  async syncPersonToZKTeco(personId) {
    try {
      // Get person data from local database
      const persons = await DatabaseHelper.query(
        "SELECT * FROM people WHERE id = ?",
        [personId]
      );

      if (persons.length === 0) {
        throw new Error("Person not found in local database");
      }

      const person = persons[0];

      // Check if employee already exists in ZKTeco
      const employees = await this.getEmployees();
      const existingEmployee = employees.find(
        (emp) => emp.emp_code === person.cnic
      );

      const employeeData = {
        emp_code: person.cnic,
        first_name: person.name.split(" ")[0],
        last_name: person.name.split(" ").slice(1).join(" ") || "",
        email: `${person.cnic}@example.com`,
        mobile: person.phone || "",
        department: 1, // You can map this to a specific department
        position: 1, // You can map this to a specific position
        hire_date: person.created_at
          ? person.created_at.toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        is_active: person.is_active || true,
      };

      let result;
      if (existingEmployee) {
        result = await this.updateEmployee(existingEmployee.id, employeeData);
      } else {
        result = await this.createEmployee(employeeData);
      }

      // Update local database with ZKTeco employee ID
      await DatabaseHelper.query(
        "UPDATE people SET zkteco_employee_id = ? WHERE id = ?",
        [result.id || existingEmployee.id, personId]
      );

      return result;
    } catch (error) {
      console.error(
        `Failed to sync person ${personId} to ZKTeco:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Sync entry/exit transaction to ZKTeco BioTime
   */
  async syncEntryExitToZKTeco(entryLogId) {
    try {
      // Get entry log data
      const entryLogs = await DatabaseHelper.query(
        `
        SELECT el.*, p.cnic, p.name, p.zkteco_employee_id
        FROM entry_logs el
        JOIN people p ON el.person_id = p.id
        WHERE el.id = ?
      `,
        [entryLogId]
      );

      if (entryLogs.length === 0) {
        throw new Error("Entry log not found");
      }

      const entryLog = entryLogs[0];

      // Push entry transaction
      if (entryLog.entry_type === "ENTRY") {
        await this.pushTransaction({
          emp_code: entryLog.cnic,
          punch_time: entryLog.entry_time.toISOString(),
          punch_state: 0, // Check In
          verify_type: 3, // Card/QR verification
          work_code: "ENTRY",
          terminal_sn: "ENTRY_SYSTEM",
        });
      }

      // Push exit transaction if exit time exists
      if (entryLog.exit_time) {
        await this.pushTransaction({
          emp_code: entryLog.cnic,
          punch_time: entryLog.exit_time.toISOString(),
          punch_state: 1, // Check Out
          verify_type: 3, // Card/QR verification
          work_code: "EXIT",
          terminal_sn: "ENTRY_SYSTEM",
        });
      }

      // Mark as synced
      await DatabaseHelper.query(
        "UPDATE entry_logs SET zkteco_synced = TRUE WHERE id = ?",
        [entryLogId]
      );

      console.log(`✅ Entry/Exit synced to ZKTeco for ${entryLog.name}`);
      return true;
    } catch (error) {
      console.error(
        `Failed to sync entry/exit ${entryLogId} to ZKTeco:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Pull attendance data from ZKTeco and create entries in local system
   */
  async pullAttendanceFromZKTeco(startDate = null, endDate = null) {
    try {
      const transactions = await this.getTransactions(startDate, endDate);
      let processedCount = 0;

      for (const transaction of transactions) {
        try {
          // Find corresponding person in local database
          const persons = await DatabaseHelper.query(
            "SELECT * FROM people WHERE cnic = ?",
            [transaction.emp_code]
          );

          if (persons.length === 0) {
            console.warn(
              `Person with CNIC ${transaction.emp_code} not found in local database`
            );
            continue;
          }

          const person = persons[0];
          const punchTime = new Date(transaction.punch_time);

          // Check if this transaction already exists
          const existingEntry = await DatabaseHelper.query(
            `
            SELECT id FROM entry_logs 
            WHERE person_id = ? 
            AND ABS(TIMESTAMPDIFF(SECOND, entry_time, ?)) < 60
            AND zkteco_transaction_id = ?
          `,
            [person.id, punchTime, transaction.id]
          );

          if (existingEntry.length > 0) {
            continue; // Skip duplicate
          }

          // Determine entry type based on punch_state
          const entryType = transaction.punch_state === 0 ? "ENTRY" : "EXIT";

          if (entryType === "ENTRY") {
            // Create entry record
            const result = await DatabaseHelper.query(
              `
              INSERT INTO entry_logs (
                person_id, entry_type, entry_time, operator_id, 
                payment_status, zkteco_transaction_id, zkteco_synced
              ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
              [person.id, "ENTRY", punchTime, 1, "WAIVED", transaction.id, true]
            );

            console.log(
              `✅ Entry created from ZKTeco: ${person.name} at ${punchTime}`
            );
            processedCount++;
          } else {
            // Update latest entry with exit time
            const latestEntries = await DatabaseHelper.query(
              `
              SELECT * FROM entry_logs 
              WHERE person_id = ? AND entry_type = 'ENTRY' AND exit_time IS NULL
              ORDER BY entry_time DESC LIMIT 1
            `,
              [person.id]
            );

            if (latestEntries.length > 0) {
              await DatabaseHelper.query(
                "UPDATE entry_logs SET exit_time = ?, zkteco_exit_transaction_id = ? WHERE id = ?",
                [punchTime, transaction.id, latestEntries[0].id]
              );

              console.log(
                `✅ Exit updated from ZKTeco: ${person.name} at ${punchTime}`
              );
              processedCount++;
            }
          }
        } catch (error) {
          console.error(
            `Error processing transaction ${transaction.id}:`,
            error.message
          );
        }
      }

      console.log(`✅ Processed ${processedCount} transactions from ZKTeco`);
      return processedCount;
    } catch (error) {
      console.error("Failed to pull attendance from ZKTeco:", error.message);
      throw error;
    }
  }

  /**
   * Test connection to ZKTeco BioTime server
   */
  async testConnection() {
    try {
      await this.authenticate();
      const departments = await this.getDepartments();
      const employees = await this.getEmployees();

      return {
        success: true,
        message: "Successfully connected to ZKTeco BioTime",
        departments: departments.length,
        employees: employees.length,
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
      };
    }
  }
}

module.exports = ZKTecoService;
