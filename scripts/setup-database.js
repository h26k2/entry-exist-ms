#!/usr/bin/env node

/**
 * Database Setup Script for Entry/Exit Management System
 *
 * This script creates the MySQL database and all required tables
 * for the Entry/Exit Management System.
 */

require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  charset: "utf8mb4",
};

const DB_NAME = process.env.DB_NAME || "entry_exit_db";

// SQL schema for all tables
const SCHEMA = {
  database: `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,

  users: `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      cnic_num VARCHAR(15) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'operator') NOT NULL DEFAULT 'operator',
      last_login TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_cnic (cnic_num),
      INDEX idx_role (role),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB;
  `,

  categories: `
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_name (name),
      INDEX idx_active (is_active)
    ) ENGINE=InnoDB;
  `,

  people: `
    CREATE TABLE IF NOT EXISTS people (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      cnic VARCHAR(15) UNIQUE NOT NULL,
      father_name VARCHAR(255),
      phone VARCHAR(20),
      address TEXT,
      category_id INT,
      card_number VARCHAR(50) UNIQUE,
      photo_url VARCHAR(500),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      INDEX idx_cnic (cnic),
      INDEX idx_name (name),
      INDEX idx_card_number (card_number),
      INDEX idx_category (category_id),
      INDEX idx_active (is_active),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB;
  `,

  family_members: `
    CREATE TABLE IF NOT EXISTS family_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      person_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      relation VARCHAR(100) NOT NULL,
      cnic VARCHAR(15),
      age INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
      INDEX idx_person_id (person_id),
      INDEX idx_cnic (cnic)
    ) ENGINE=InnoDB;
  `,

  entries: `
    CREATE TABLE IF NOT EXISTS entries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      person_id INT NOT NULL,
      entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      exit_time TIMESTAMP NULL,
      status ENUM('inside', 'exited') DEFAULT 'inside',
      fee_paid DECIMAL(10,2) DEFAULT 0.00,
      operator_id INT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
      FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_person_id (person_id),
      INDEX idx_status (status),
      INDEX idx_entry_time (entry_time),
      INDEX idx_exit_time (exit_time),
      INDEX idx_operator_id (operator_id),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB;
  `,

  fee_deposits: `
    CREATE TABLE IF NOT EXISTS fee_deposits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      person_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      deposit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      operator_id INT,
      notes TEXT,
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
      FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_person_id (person_id),
      INDEX idx_deposit_date (deposit_date),
      INDEX idx_operator_id (operator_id)
    ) ENGINE=InnoDB;
  `,

  user_sessions: `
    CREATE TABLE IF NOT EXISTS user_sessions (
      session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
      expires BIGINT UNSIGNED NOT NULL,
      data MEDIUMTEXT COLLATE utf8mb4_bin,
      INDEX idx_expires (expires)
    ) ENGINE=InnoDB;
  `,

  categories: `
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_name (name)
    ) ENGINE=InnoDB;
  `,

  app_users: `
    CREATE TABLE IF NOT EXISTS app_users (
      id VARCHAR(50) PRIMARY KEY COMMENT 'References personnel_employee.emp_code',
      type ENUM('Civilian', 'Retired Officer', 'Serving personnel') NOT NULL,
      cnic_number VARCHAR(13) NOT NULL UNIQUE,
      pa_num TEXT UNIQUE,
      rank TEXT,
      retired_unit_hq TEXT,
      original_unit TEXT,
      current_unit TEXT,
      profession JSON,
      father_name TEXT,
      father_profession JSON,
      family_details JSON,
      home_address JSON,
      sponsored_serving_military_officer ENUM('yes', 'no') DEFAULT 'no',
      sponsored_serving_military_officer_details JSON,
      verified_by_rac ENUM('yes', 'no') DEFAULT 'no',
      verified_by_rac_details JSON,
      ctr_signed_by_hq_malir ENUM('yes', 'no') DEFAULT 'no',
      ctr_signed_by_hq_malir_details JSON,
      oic_gsc_recommended ENUM('yes', 'no') DEFAULT 'no',
      co_maint_unit_recommended ENUM('yes', 'no') DEFAULT 'no',
      date DATE,
      billing_mode ENUM('self', 'sponsored') DEFAULT 'self',
      amount_payable INT DEFAULT 0,
      discount INT DEFAULT 0,
      net_payable INT DEFAULT 0,
      payment_terms ENUM('monthly', 'quarterly', 'half_yearly', 'yearly') DEFAULT 'monthly',
      garrisson_id_for_sponsored VARCHAR(50),
      garrisson_name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_cnic_number (cnic_number),
      INDEX idx_type (type),
      INDEX idx_billing_mode (billing_mode),
      INDEX idx_payment_terms (payment_terms),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB;
  `,
};

// Default data
const DEFAULT_CATEGORIES = [
  { name: "Visitor", fee: 50.0, description: "General visitors" },
  { name: "Student", fee: 20.0, description: "Educational visits" },
  { name: "Official", fee: 0.0, description: "Official business" },
  { name: "VIP", fee: 0.0, description: "VIP guests" },
];

const DEFAULT_ADMIN = {
  name: "System Administrator",
  cnic_num: "1234567890123",
  password: "admin123",
  role: "admin",
};

async function setupDatabase() {
  let connection;

  try {
    console.log("🚀 Starting database setup...");

    // Connect to MySQL server (without database)
    console.log("📡 Connecting to MySQL server...");
    connection = await mysql.createConnection(DB_CONFIG);
    console.log("✅ Connected to MySQL server");

    // Create database
    console.log(`🏗️  Creating database: ${DB_NAME}`);
    await connection.execute(SCHEMA.database);
    console.log("✅ Database created/verified");

    // Use the database
    await connection.execute(`USE \`${DB_NAME}\``);

    // Create tables in order (respecting foreign key constraints)
    const tableOrder = [
      "users",
      "categories",
      "people",
      "family_members",
      "entries",
      "fee_deposits",
      "user_sessions",
      "app_users",
    ];

    for (const table of tableOrder) {
      await connection.execute(SCHEMA[table]);
    }

    // Insert default categories
    for (const category of DEFAULT_CATEGORIES) {
      try {
        await connection.execute(
          "INSERT IGNORE INTO categories (name, fee, description) VALUES (?, ?, ?)",
          [category.name, category.fee, category.description]
        );
      } catch (err) {
        // Ignore duplicate entries
      }
    }
    // Create default admin user
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 12);
    try {
      await connection.execute(
        "INSERT IGNORE INTO users (name, cnic_num, password, role, created_at) VALUES (?, ?, ?, ?, NOW())",
        [
          DEFAULT_ADMIN.name,
          DEFAULT_ADMIN.cnic_num,
          hashedPassword,
          DEFAULT_ADMIN.role,
        ]
      );
    } catch (err) {
      // Ignore duplicate admin
    }

    // Verify setup
    const [tables] = await connection.execute("SHOW TABLES");
    const [userCount] = await connection.execute(
      "SELECT COUNT(*) as count FROM users"
    );
    const [categoryCount] = await connection.execute(
      "SELECT COUNT(*) as count FROM categories"
    );
    // Optionally print summary here if needed
  } catch (error) {
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
