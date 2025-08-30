-- Add type column to app_users table if it doesn't exist
-- This allows storing user type for filtering and categorization

-- Check if column exists and add it if not
SET @col_exists = 0;
SELECT 1 INTO @col_exists
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'app_users' 
  AND COLUMN_NAME = 'type';

SET @query = IF(@col_exists = 0, 
  'ALTER TABLE app_users ADD COLUMN type ENUM("Civilian", "Civil Govt. Officer", "Retired Officer", "Serving personnel") DEFAULT "Civilian"',
  'SELECT "Column type already exists" as message'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- If the column existed but didn't have the new enum value, update it
SET @query = 'ALTER TABLE app_users MODIFY COLUMN type ENUM("Civilian", "Civil Govt. Officer", "Retired Officer", "Serving personnel") DEFAULT "Civilian"';
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
