-- Add Master Entries Table
-- Run this script to add the master_entries table to an existing database

CREATE TABLE IF NOT EXISTS master_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    description TEXT,
    checked_in BOOLEAN DEFAULT FALSE,
    check_in_time TIMESTAMP NULL,
    checked_out BOOLEAN DEFAULT FALSE,
    check_out_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_master_entries_checked_in (checked_in),
    INDEX idx_master_entries_checked_out (checked_out),
    INDEX idx_master_entries_check_in_time (check_in_time),
    INDEX idx_master_entries_check_out_time (check_out_time)
) ENGINE=InnoDB;

-- Verify table creation
SELECT 'master_entries table created successfully' as status;
