# Entry/Exit Management System - Setup Guide

## 🎯 System Overview

This is a comprehensive entry/exit management system with features for:

- Entry and exit tracking with modal-based UI
- People management with categories (Paid, Civilian, Military, etc.)
- Fee management and payment tracking
- Guest management with host associations
- Comprehensive reporting and analytics
- Card generation and management
- Real-time occupancy tracking

## 🛠️ Installation Steps

### Option 1: MySQL Setup (Recommended for Production)

#### Step 1: Install MySQL

```bash
# Install MySQL via Homebrew (macOS)
brew install mysql

# Start MySQL service
brew services start mysql

# Secure MySQL installation (optional but recommended)
mysql_secure_installation
```

#### Step 2: Create Database User

```bash
# Connect to MySQL as root
mysql -u root -p

# In MySQL console, create a user and database
CREATE DATABASE garrison;
CREATE USER 'entry_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON garrison.* TO 'entry_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Step 3: Update Environment Variables

Update `.env` file with your MySQL credentials:

```
PORT=3000
DB_HOST=localhost
DB_USER=entry_user
DB_PASSWORD=your_password
DB_NAME=garrison
```

#### Step 4: Run Database Setup

```bash
node setup-database.js
```

### Option 2: SQLite Setup (Quick Development)

If you want to skip MySQL setup for now, you can use SQLite:

#### Step 1: Install SQLite Dependencies

```bash
npm install sqlite3
```

#### Step 2: Use SQLite Configuration

We'll create a SQLite version for quick testing.

## 🏃‍♂️ Running the Application

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Setup Database** (after MySQL is configured)

   ```bash
   node setup-database.js
   ```

3. **Start Server**

   ```bash
   node server.js
   ```

4. **Access Application**
   - Open: http://localhost:3000
   - Login with default credentials:
     - **Admin**: CNIC: `1234567890123`, Password: `admin123`
     - **Operator**: CNIC: `9876543210987`, Password: `operator123`

## 🎮 Features Available

### 1. Entry Management

- **Entry Modal**: Process new entries with person search, guest handling, facility selection
- **Exit Modal**: Process exits with fee calculation and payment
- **Search People Inside**: Find people currently inside for exit processing

### 2. People Management

- **Add Person**: Register new people with categories and card assignment
- **Edit Person**: Update person details and category
- **Search & Filter**: Find people by name, CNIC, category, or card number
- **Family Member**: Associate family members with host persons

### 3. Reporting & Analytics

- **Entry/Exit Reports**: Daily, weekly, monthly reports with filters
- **Revenue Reports**: Fee collection and payment analysis
- **Occupancy Reports**: Current occupancy and peak times
- **Export Options**: PDF and Excel export capabilities

### 4. Additional Features

- **Fee Deposits**: Pre-payment and deposit management
- **Guest Management**: Guest registration with host tracking
- **Card Generation**: Automated card number assignment
- **Cricket Team Entry**: Special handling for team entries
- **Payment Tracking**: Multiple payment methods and status tracking

## 🏗️ Database Schema

The system includes:

- **Users**: Admin and operator accounts
- **Categories**: Person classification (Paid, Military, Civilian, etc.)
- **People**: Person registry with card details
- **Entry Logs**: Entry/exit tracking with timestamps
- **Facilities**: Available facilities with pricing
- **Fee Deposits**: Payment and deposit tracking

## 🔧 Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `DB_HOST`: Database host
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name

### Default Data

The setup script creates:

- 5 categories (Paid, Civilian, Military Serving, Retired, Staff)
- 8 facilities (Swimming Pool, Gym, Restaurant, etc.)
- 2 users (Admin and Operator)
- 5 sample people

## 🚀 Quick Start with SQLite (Alternative)

If you want to get started immediately without MySQL:

1. We can create a SQLite version
2. All features will work the same
3. Database file will be stored locally
4. Perfect for development and testing

Would you like me to create the SQLite version?

## 📱 UI Features

### Modal System

- **Responsive Design**: Works on desktop and mobile
- **Real-time Search**: Live search with debouncing
- **Form Validation**: Client and server-side validation
- **Loading States**: Visual feedback for all operations

### Navigation

- **Sidebar Menu**: Quick access to all modules
- **Breadcrumbs**: Clear navigation path
- **Role-based Access**: Different features for admin/operator

### Styling

- **Modern CSS**: Custom styling for all components
- **Consistent Theme**: Unified color scheme and typography
- **Interactive Elements**: Hover effects and transitions

## 🛡️ Security Features

- **Session Management**: Secure login sessions
- **Password Hashing**: bcrypt for password security
- **Role-based Access**: Admin and operator permissions
- **SQL Injection Protection**: Parameterized queries
- **CSRF Protection**: Built-in protection mechanisms

## 📞 Support

For issues or questions:

1. Check the console for error messages
2. Verify database connection
3. Check environment variables
4. Review server logs in terminal

## 🔄 Next Steps

1. **Setup Database**: Choose MySQL or SQLite option
2. **Test Login**: Use default credentials
3. **Explore Features**: Try each modal and feature
4. **Customize**: Modify categories, facilities, and settings
5. **Production**: Configure for your specific requirements
