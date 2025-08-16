-- ZKTeco Integration Schema Updates

-- Add ZKTeco fields to people table
ALTER TABLE people 
ADD COLUMN zkteco_employee_id INT NULL,
ADD COLUMN zkteco_synced BOOLEAN DEFAULT FALSE,
ADD COLUMN zkteco_last_sync TIMESTAMP NULL,
ADD INDEX idx_zkteco_employee_id (zkteco_employee_id);

-- Add ZKTeco fields to entry_logs table
ALTER TABLE entry_logs 
ADD COLUMN zkteco_synced BOOLEAN DEFAULT FALSE,
ADD COLUMN zkteco_transaction_id VARCHAR(50) NULL,
ADD COLUMN zkteco_exit_transaction_id VARCHAR(50) NULL,
ADD COLUMN zkteco_sync_time TIMESTAMP NULL,
ADD INDEX idx_zkteco_synced (zkteco_synced),
ADD INDEX idx_zkteco_transaction_id (zkteco_transaction_id);

-- Create ZKTeco sync log table
CREATE TABLE IF NOT EXISTS zkteco_sync_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sync_type ENUM('PERSON', 'ENTRY', 'EXIT', 'PULL_ATTENDANCE') NOT NULL,
    local_record_id INT NOT NULL,
    zkteco_record_id VARCHAR(50) NULL,
    sync_status ENUM('SUCCESS', 'FAILED', 'PENDING') NOT NULL,
    error_message TEXT NULL,
    sync_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sync_type (sync_type),
    INDEX idx_sync_status (sync_status),
    INDEX idx_local_record_id (local_record_id)
);

-- Create ZKTeco configuration table
CREATE TABLE IF NOT EXISTS zkteco_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default ZKTeco configuration
INSERT INTO zkteco_config (config_key, config_value, description) VALUES
('server_url', 'http://localhost:8000', 'ZKTeco BioTime server URL'),
('username', 'admin', 'ZKTeco BioTime username'),
('auto_sync_enabled', 'false', 'Enable automatic synchronization'),
('sync_interval_minutes', '5', 'Sync interval in minutes'),
('default_department_id', '1', 'Default department ID for new employees'),
('default_position_id', '1', 'Default position ID for new employees'),
('pull_attendance_enabled', 'true', 'Enable pulling attendance from ZKTeco'),
('last_attendance_pull', '2024-01-01 00:00:00', 'Last attendance pull timestamp')
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);

-- Create view for ZKTeco sync status
CREATE VIEW zkteco_sync_status AS
SELECT 
    'people' as record_type,
    COUNT(*) as total_records,
    SUM(CASE WHEN zkteco_employee_id IS NOT NULL THEN 1 ELSE 0 END) as synced_records,
    COUNT(*) - SUM(CASE WHEN zkteco_employee_id IS NOT NULL THEN 1 ELSE 0 END) as unsynced_records
FROM people WHERE is_active = 1
UNION ALL
SELECT 
    'entries' as record_type,
    COUNT(*) as total_records,
    SUM(CASE WHEN zkteco_synced = 1 THEN 1 ELSE 0 END) as synced_records,
    COUNT(*) - SUM(CASE WHEN zkteco_synced = 1 THEN 1 ELSE 0 END) as unsynced_records
FROM entry_logs 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);
