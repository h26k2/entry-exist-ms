#!/usr/bin/env node

/**
 * ZKTeco Integration Setup Script
 *
 * This script adds ZKTeco integration fields to existing database
 */

require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs").promises;
const path = require("path");

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "entry_exit_db",
  charset: "utf8mb4",
};

async function setupZKTecoIntegration() {
  let connection;

  try {
    console.log("🚀 Starting ZKTeco integration setup...");

    // Connect to database
    connection = await mysql.createConnection(DB_CONFIG);
    console.log("✅ Connected to database");

    // Read and execute ZKTeco schema
    const schemaPath = path.join(__dirname, "../sql/zkteco_schema.sql");
    const schemaSQL = await fs.readFile(schemaPath, "utf8");

    // Split SQL statements and execute them
    const statements = schemaSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log("📝 Applying ZKTeco schema updates...");

    for (const statement of statements) {
      try {
        await connection.execute(statement);
        console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
      } catch (error) {
        // Ignore duplicate column/table errors
        if (
          error.code === "ER_DUP_FIELDNAME" ||
          error.code === "ER_TABLE_EXISTS_ERROR" ||
          error.code === "ER_DUP_KEYNAME"
        ) {
          console.log(`⚠️ Already exists: ${statement.substring(0, 50)}...`);
        } else {
          console.error(`❌ Error executing: ${statement.substring(0, 50)}...`);
          console.error(error.message);
        }
      }
    }

    // Verify setup
    console.log("🔍 Verifying ZKTeco integration setup...");

    // Check if columns were added
    const [peopleColumns] = await connection.execute(
      `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'people' 
      AND COLUMN_NAME LIKE 'zkteco%'
    `,
      [DB_CONFIG.database]
    );

    const [entryColumns] = await connection.execute(
      `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'entry_logs' 
      AND COLUMN_NAME LIKE 'zkteco%'
    `,
      [DB_CONFIG.database]
    );

    const [zktecoTables] = await connection.execute(
      `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'zkteco%'
    `,
      [DB_CONFIG.database]
    );

    console.log("📊 Setup Summary:");
    console.log(`   People table ZKTeco columns: ${peopleColumns.length}`);
    console.log(`   Entry logs ZKTeco columns: ${entryColumns.length}`);
    console.log(`   ZKTeco tables created: ${zktecoTables.length}`);

    if (
      peopleColumns.length >= 3 &&
      entryColumns.length >= 4 &&
      zktecoTables.length >= 2
    ) {
      console.log("✅ ZKTeco integration setup completed successfully!");
      console.log("");
      console.log("📝 Next Steps:");
      console.log("1. Update your .env file with ZKTeco server details:");
      console.log("   ZKTECO_BASE_URL=http://your-zkteco-server:8000");
      console.log("   ZKTECO_USERNAME=your-username");
      console.log("   ZKTECO_PASSWORD=your-password");
      console.log("");
      console.log("2. Restart your application");
      console.log("3. Navigate to /zkteco to access the integration panel");
      console.log("4. Test the connection and sync your data");
    } else {
      console.log("⚠️ Setup may be incomplete. Please check the logs above.");
    }
  } catch (error) {
    console.error("❌ ZKTeco integration setup failed:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  setupZKTecoIntegration();
}

module.exports = { setupZKTecoIntegration };
