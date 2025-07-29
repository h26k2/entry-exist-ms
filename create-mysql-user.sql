-- Run this script in MySQL Workbench to create the application database and user

-- Create the database
CREATE DATABASE IF NOT EXISTS garrison;

-- Create a new user for the application (change password as needed)
CREATE USER IF NOT EXISTS 'garrison_user'@'localhost' IDENTIFIED BY 'garrison_pass';

-- Grant all privileges on the garrison database to the new user
GRANT ALL PRIVILEGES ON garrison.* TO 'garrison_user'@'localhost';

-- Flush privileges to ensure changes take effect
FLUSH PRIVILEGES;

-- Show databases to confirm creation
SHOW DATABASES;

-- Show users to confirm user creation
SELECT User, Host FROM mysql.user WHERE User = 'garrison_user';
