#!/usr/bin/env node

/**
 * Script to add family member columns to app_users table
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

async function addFamilyMemberColumns() {
  let connection;
  
  try {
    console.log("Connecting to database...");
    connection = await mysql.createConnection(DB_CONFIG);
    
    // First, update the type ENUM to include "Family Member"
    console.log("Updating type ENUM to include 'Family Member'...");
    await connection.execute(`
      ALTER TABLE app_users 
      MODIFY COLUMN type ENUM('Civilian', 'Civil Govt. Officer', 'Retired Officer', 'Serving personnel', 'Family Member') 
      DEFAULT 'Civilian'
    `);
    console.log("✓ Type ENUM updated successfully");
    
    // Check if relation_with_head column exists
    const [relationColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'app_users' 
        AND COLUMN_NAME = 'relation_with_head'
    `, [DB_CONFIG.database]);
    
    if (relationColumns.length === 0) {
      console.log("Adding relation_with_head column...");
      await connection.execute(`
        ALTER TABLE app_users 
        ADD COLUMN relation_with_head ENUM('Spouse', 'Children', 'Sibling', 'Other') 
        DEFAULT NULL 
        AFTER type
      `);
      console.log("✓ relation_with_head column added successfully");
    } else {
      console.log("relation_with_head column already exists");
    }
    
    // Check if family_head_id column exists
    const [familyHeadColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'app_users' 
        AND COLUMN_NAME = 'family_head_id'
    `, [DB_CONFIG.database]);
    
    if (familyHeadColumns.length === 0) {
      console.log("Adding family_head_id column...");
      await connection.execute(`
        ALTER TABLE app_users 
        ADD COLUMN family_head_id VARCHAR(50) 
        DEFAULT NULL 
        AFTER relation_with_head,
        ADD CONSTRAINT fk_family_head 
        FOREIGN KEY (family_head_id) REFERENCES app_users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
      `);
      console.log("✓ family_head_id column and foreign key constraint added successfully");
    } else {
      console.log("family_head_id column already exists");
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
addFamilyMemberColumns();
