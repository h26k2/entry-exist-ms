#!/usr/bin/env node

/**
 * Script to add type column to app_users table
 */

require("dotenv").config();
const mysql = require("mysql2/promise");

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "entry_exit_db",
  charset: "utf8mb4",
};

async function addUserTypeColumn() {
  let connection;
  
  try {
    console.log("Connecting to database...");
    connection = await mysql.createConnection(DB_CONFIG);
    
    // Check if column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'app_users' 
        AND COLUMN_NAME = 'type'
    `, [DB_CONFIG.database]);
    
    if (columns.length === 0) {
      console.log("Adding type column to app_users table...");
      await connection.execute(`
        ALTER TABLE app_users 
        ADD COLUMN type ENUM('Civilian', 'Civil Govt. Officer', 'Retired Officer', 'Serving personnel') 
        DEFAULT 'Civilian' 
        AFTER last_name
      `);
      console.log("✓ Type column added successfully");
    } else {
      console.log("Type column already exists. Updating ENUM values...");
      await connection.execute(`
        ALTER TABLE app_users 
        MODIFY COLUMN type ENUM('Civilian', 'Civil Govt. Officer', 'Retired Officer', 'Serving personnel') 
        DEFAULT 'Civilian'
      `);
      console.log("✓ Type column ENUM values updated successfully");
    }
    
    // Show the updated table structure
    const [tableInfo] = await connection.execute("DESCRIBE app_users");
    console.log("\nUpdated app_users table structure:");
    console.table(tableInfo);
    
  } catch (error) {
    console.error("Error updating database:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
addUserTypeColumn();
