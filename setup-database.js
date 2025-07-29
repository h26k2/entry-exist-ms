const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
require("dotenv").config();

async function setupDatabase() {
  let connection;

  try {
    // Connect to MySQL server (without specifying database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
    });

    console.log("Connected to MySQL server");

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || "entry_exit_ms";
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);

    // Close the connection and reconnect to the specific database
    await connection.end();

    // Reconnect to the specific database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: dbName,
    });

    console.log(`Database ${dbName} created/selected`);

    // Create tables
    console.log("Creating tables...");

    // Users table (if not exists)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        cnic_num VARCHAR(15) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'operator') DEFAULT 'operator',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Categories table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        requires_payment BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Facilities table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS facilities (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // People table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS people (
        id INT PRIMARY KEY AUTO_INCREMENT,
        cnic VARCHAR(15) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        category_id INT,
        is_family_member BOOLEAN DEFAULT FALSE,
        host_person_id INT NULL,
        emergency_contact VARCHAR(20),
        remarks TEXT,
        card_number VARCHAR(20) UNIQUE,
        card_issued_date DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (host_person_id) REFERENCES people(id)
      )
    `);

    // Entry/Exit logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS entry_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        person_id INT NOT NULL,
        entry_type ENUM('ENTRY', 'EXIT') NOT NULL,
        entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        exit_time TIMESTAMP NULL,
        operator_id INT NOT NULL,
        has_stroller BOOLEAN DEFAULT FALSE,
        vehicle_number VARCHAR(20),
        is_guest BOOLEAN DEFAULT FALSE,
        host_person_id INT NULL,
        guest_count INT DEFAULT 1,
        total_amount DECIMAL(10,2) DEFAULT 0.00,
        payment_status ENUM('PENDING', 'PAID', 'WAIVED', 'HOST_PAYS') DEFAULT 'PENDING',
        payment_method ENUM('CASH', 'CARD', 'DIGITAL', 'WAIVED') NULL,
        is_cricket_team BOOLEAN DEFAULT FALSE,
        team_name VARCHAR(100) NULL,
        team_members_count INT DEFAULT 0,
        remarks TEXT,
        is_fee_locked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (person_id) REFERENCES people(id),
        FOREIGN KEY (operator_id) REFERENCES users(id),
        FOREIGN KEY (host_person_id) REFERENCES people(id)
      )
    `);

    // Entry facility usage tracking
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS entry_facilities (
        id INT PRIMARY KEY AUTO_INCREMENT,
        entry_log_id INT NOT NULL,
        facility_id INT NOT NULL,
        quantity INT DEFAULT 1,
        unit_price DECIMAL(10,2),
        total_price DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (entry_log_id) REFERENCES entry_logs(id) ON DELETE CASCADE,
        FOREIGN KEY (facility_id) REFERENCES facilities(id)
      )
    `);

    // Fee deposits table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS fee_deposits (
        id INT PRIMARY KEY AUTO_INCREMENT,
        person_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        deposit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        description TEXT,
        deposited_by INT NOT NULL,
        receipt_number VARCHAR(50),
        is_refundable BOOLEAN DEFAULT TRUE,
        status ENUM('ACTIVE', 'USED', 'REFUNDED') DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (person_id) REFERENCES people(id),
        FOREIGN KEY (deposited_by) REFERENCES users(id)
      )
    `);

    console.log("Tables created successfully");

    // Insert default categories
    await connection.execute(`
      INSERT IGNORE INTO categories (name, description, requires_payment) VALUES
      ('Paid', 'Regular paying customers', TRUE),
      ('Civilian', 'Civilian personnel', TRUE),
      ('Military Serving', 'Active military personnel', FALSE),
      ('Retired', 'Retired personnel', TRUE),
      ('Staff', 'Staff members', FALSE)
    `);

    // Insert default facilities
    await connection.execute(`
      INSERT IGNORE INTO facilities (name, price, description) VALUES
      ('Swimming Pool', 50.00, 'Access to swimming pool'),
      ('Gym', 30.00, 'Gym facility access'),
      ('Restaurant', 0.00, 'Restaurant services (pay per order)'),
      ('Cricket Ground', 100.00, 'Cricket ground booking'),
      ('Parking', 20.00, 'Vehicle parking'),
      ('Guest House', 200.00, 'Guest house accommodation'),
      ('Tennis Court', 75.00, 'Tennis court booking'),
      ('Conference Hall', 150.00, 'Conference hall booking')
    `);

    // Create admin user if not exists
    const adminPassword = await bcrypt.hash("admin123", 10);
    await connection.execute(
      `
      INSERT IGNORE INTO users (name, cnic_num, password, role) VALUES
      ('System Administrator', '1234567890123', ?, 'admin')
    `,
      [adminPassword]
    );

    // Create sample operator
    const operatorPassword = await bcrypt.hash("operator123", 10);
    await connection.execute(
      `
      INSERT IGNORE INTO users (name, cnic_num, password, role) VALUES
      ('Gate Operator', '9876543210987', ?, 'operator')
    `,
      [operatorPassword]
    );

    // Create sample people
    await connection.execute(`
      INSERT IGNORE INTO people (cnic, name, phone, address, category_id, card_number, card_issued_date) VALUES
      ('1111111111111', 'John Doe', '03001234567', '123 Main Street, City', 1, 'CARD12345678', CURDATE()),
      ('2222222222222', 'Jane Smith', '03007654321', '456 Oak Avenue, Town', 2, 'CARD87654321', CURDATE()),
      ('3333333333333', 'Major Ahmed Ali', '03009876543', 'Military Base, Sector 7', 3, 'CARD11111111', CURDATE()),
      ('4444444444444', 'Retired Col. Khan', '03005555555', '789 Pine Street, Village', 4, 'CARD22222222', CURDATE()),
      ('5555555555555', 'Staff Member Sarah', '03006666666', 'Staff Quarters, Block A', 5, 'CARD33333333', CURDATE())
    `);

    // Create indexes for better performance
    try {
      await connection.execute(
        `CREATE INDEX idx_entry_logs_person_time ON entry_logs(person_id, entry_time)`
      );
    } catch (e) {
      if (e.code !== "ER_DUP_KEYNAME") throw e;
    }

    try {
      await connection.execute(
        `CREATE INDEX idx_entry_logs_entry_type ON entry_logs(entry_type)`
      );
    } catch (e) {
      if (e.code !== "ER_DUP_KEYNAME") throw e;
    }

    try {
      await connection.execute(`CREATE INDEX idx_people_cnic ON people(cnic)`);
    } catch (e) {
      if (e.code !== "ER_DUP_KEYNAME") throw e;
    }

    try {
      await connection.execute(
        `CREATE INDEX idx_people_category ON people(category_id)`
      );
    } catch (e) {
      if (e.code !== "ER_DUP_KEYNAME") throw e;
    }

    try {
      await connection.execute(
        `CREATE INDEX idx_current_entries ON entry_logs(entry_type, exit_time)`
      );
    } catch (e) {
      if (e.code !== "ER_DUP_KEYNAME") throw e;
    }

    // Create current occupancy view
    await connection.execute(`
      CREATE OR REPLACE VIEW current_occupancy AS
      SELECT 
        el.person_id,
        p.name,
        p.cnic,
        c.name as category,
        el.entry_time,
        el.has_stroller,
        el.is_guest,
        el.guest_count,
        el.is_cricket_team,
        el.team_members_count
      FROM entry_logs el
      JOIN people p ON el.person_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE el.entry_type = 'ENTRY' 
      AND el.exit_time IS NULL
      AND el.id = (
        SELECT MAX(id) 
        FROM entry_logs el2 
        WHERE el2.person_id = el.person_id
      )
    `);

    console.log("✅ Database setup completed successfully!");
    console.log("\n📝 Default Login Credentials:");
    console.log("Admin - CNIC: 1234567890123, Password: admin123");
    console.log("Operator - CNIC: 9876543210987, Password: operator123");
    console.log("\n🏢 Sample data has been inserted including:");
    console.log(
      "- 5 Categories (Paid, Civilian, Military Serving, Retired, Staff)"
    );
    console.log("- 8 Facilities (Swimming Pool, Gym, Restaurant, etc.)");
    console.log("- 5 Sample people with different categories");
    console.log("- 2 Users (Admin and Operator)");
  } catch (error) {
    console.error("❌ Error setting up database:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the setup
setupDatabase();
