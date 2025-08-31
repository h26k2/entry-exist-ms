-- Add people_count column to master_entries table
-- Run this script to add the people_count column to existing master_entries table

ALTER TABLE master_entries 
ADD COLUMN people_count INT DEFAULT 1 
AFTER description;

-- Verify column addition
DESCRIBE master_entries;

-- Update any existing records to have a default people count
UPDATE master_entries 
SET people_count = 1 
WHERE people_count IS NULL;

SELECT 'people_count column added successfully to master_entries table' as status;
