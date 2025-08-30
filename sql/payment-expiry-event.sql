-- Create an event to automatically expire payments after 35 days
-- This runs daily at 12:05 AM to check and update expired payments

DELIMITER $$

CREATE EVENT IF NOT EXISTS expire_payments
ON SCHEDULE EVERY 1 DAY
DO
BEGIN
    UPDATE app_users 
    SET is_paid = FALSE 
    WHERE is_paid = TRUE 
    AND last_payment_date IS NOT NULL 
    AND DATEDIFF(NOW(), last_payment_date) > 35;
END$$

DELIMITER ;

-- Create a log table to track payment expiries (optional)
CREATE TABLE IF NOT EXISTS payment_expiry_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expired_count INT DEFAULT 0,
    check_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date (DATE(check_date))
);

-- Enable the event scheduler (if not already enabled)
SET GLOBAL event_scheduler = ON;

-- Check if the event was created successfully
SHOW EVENTS LIKE 'expire_payments';
