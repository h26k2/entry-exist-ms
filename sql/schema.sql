-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    requires_payment BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- App Users Table
CREATE TABLE IF NOT EXISTS app_users (
    id VARCHAR(50) PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    cnic_number VARCHAR(13) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    is_paid BOOLEAN DEFAULT FALSE,
    last_payment_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Entry Exit Management System Database Schema

-- Facilities table
CREATE TABLE facilities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample facilities
INSERT INTO facilities (name, price, description) VALUES
('Swimming Pool', 50.00, 'Access to swimming pool'),
('Gym', 30.00, 'Gym facility access'),
('Restaurant', 0.00, 'Restaurant services (pay per order)'),
('Cricket Ground', 100.00, 'Cricket ground booking'),
('Parking', 20.00, 'Vehicle parking'),
('Guest House', 200.00, 'Guest house accommodation');

-- Insert sample app users
INSERT INTO app_users (id, first_name, last_name, cnic_number, is_active) VALUES
('USER001', 'John', 'Doe', '1234567890123', TRUE),
('USER002', 'Jane', 'Smith', '2345678901234', TRUE),
('USER003', 'Ahmed', 'Khan', '3456789012345', TRUE),
('USER004', 'Sarah', 'Wilson', '4567890123456', TRUE),
('USER005', 'Mohammad', 'Ali', '5678901234567', TRUE);

-- People table for storing person information
CREATE TABLE people (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cnic VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    category_id INT,
    is_family_member BOOLEAN DEFAULT FALSE,
    host_person_id INT NULL, -- For family members, links to main person
    emergency_contact VARCHAR(20),
    remarks TEXT,
    -- card_number VARCHAR(20) UNIQUE,
    -- card_issued_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (host_person_id) REFERENCES people(id)
);

-- Entry/Exit logs table
CREATE TABLE entry_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    person_id INT NOT NULL,
    entry_type ENUM('ENTRY', 'EXIT') NOT NULL,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP NULL,
    operator_id INT NOT NULL,
    has_stroller BOOLEAN DEFAULT FALSE,
    vehicle_number VARCHAR(20),
    is_guest BOOLEAN DEFAULT FALSE,
    host_person_id INT NULL, -- For guests
    guest_count INT DEFAULT 1,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    payment_status ENUM('PENDING', 'PAID', 'WAIVED', 'HOST_PAYS') DEFAULT 'PENDING',
    payment_method ENUM('CASH', 'CARD', 'DIGITAL', 'WAIVED') NULL,
    is_cricket_team BOOLEAN DEFAULT FALSE,
    team_name VARCHAR(100) NULL,
    team_members_count INT DEFAULT 0,
    remarks TEXT,
    is_fee_locked BOOLEAN DEFAULT FALSE, -- Only admin can modify after lock
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (person_id) REFERENCES people(id),
    FOREIGN KEY (operator_id) REFERENCES users(id),
    FOREIGN KEY (host_person_id) REFERENCES people(id)
);

-- Fee deposits table
CREATE TABLE fee_deposits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    person_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    deposit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    deposited_by INT NOT NULL, -- operator/admin who recorded the deposit
    receipt_number VARCHAR(50),
    is_refundable BOOLEAN DEFAULT TRUE,
    status ENUM('ACTIVE', 'USED', 'REFUNDED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (person_id) REFERENCES people(id),
    FOREIGN KEY (deposited_by) REFERENCES users(id)
);

-- Facilities User Relations table
CREATE TABLE facilities_user_relations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    facility_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES app_users(id),
    FOREIGN KEY (facility_id) REFERENCES facilities(id)
) ENGINE=InnoDB;

-- Current occupancy view removed

-- User Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- Add indexes for better performance
CREATE INDEX idx_entry_logs_person_time ON entry_logs(person_id, entry_time);
CREATE INDEX idx_entry_logs_entry_type ON entry_logs(entry_type);
CREATE INDEX idx_people_cnic ON people(cnic);
CREATE INDEX idx_people_category ON people(category_id);
CREATE INDEX idx_current_entries ON entry_logs(entry_type, exit_time);
CREATE INDEX idx_facilities_user_relations_user ON facilities_user_relations(user_id);
CREATE INDEX idx_facilities_user_relations_facility ON facilities_user_relations(facility_id);
-- App Guests Table
CREATE TABLE app_guests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    cnic_number VARCHAR(13) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Guest Transactions Table
CREATE TABLE guest_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    guest_id INT NOT NULL,
    guest_of VARCHAR(50) NOT NULL,
    checked_in BOOLEAN DEFAULT FALSE,
    checked_out BOOLEAN DEFAULT FALSE,
    check_in_time TIMESTAMP NULL,
    check_out_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES app_guests(id),
    FOREIGN KEY (guest_of) REFERENCES app_users(id)
) ENGINE=InnoDB;

-- Invoices Table
CREATE TABLE invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(20) NOT NULL UNIQUE,
    generated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    month VARCHAR(20) NOT NULL,
    u_id VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payable_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    received BOOLEAN DEFAULT FALSE,
    received_on TIMESTAMP NULL,
    due_date DATE NULL,
    payment_method ENUM('cash', 'bank_transfer', 'cheque', 'online') NULL,
    payment_reference VARCHAR(50) NULL,
    notes TEXT NULL,
    status ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
    created_by VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (u_id) REFERENCES app_users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES app_users(id) ON DELETE SET NULL,
    INDEX idx_invoice_month (month),
    INDEX idx_invoice_user (u_id),
    INDEX idx_invoice_status (status),
    INDEX idx_invoice_received (received),
    INDEX idx_invoice_number (invoice_number)
) ENGINE=InnoDB;

-- Invoice Items Table (for detailed billing breakdown)
CREATE TABLE invoice_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id INT NOT NULL,
    facility_id INT NULL,
    description VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    item_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE SET NULL,
    INDEX idx_invoice_items_invoice (invoice_id),
    INDEX idx_invoice_items_facility (facility_id)
) ENGINE=InnoDB;
