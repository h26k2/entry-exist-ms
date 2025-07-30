-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    requires_payment BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Entry Exit Management System Database Schema


-- Facilities table
CREATE TABLE facilities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
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

-- Entry facility usage tracking
CREATE TABLE entry_facilities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entry_log_id INT NOT NULL,
    facility_id INT NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entry_log_id) REFERENCES entry_logs(id) ON DELETE CASCADE,
    FOREIGN KEY (facility_id) REFERENCES facilities(id)
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

-- Current occupancy view
CREATE VIEW current_occupancy AS
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
);

-- User Categories Table
CREATE TABLE IF NOT EXISTS user_categories (
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
