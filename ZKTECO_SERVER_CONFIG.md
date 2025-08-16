# ZKTeco Server Configuration Guide

## Overview

This guide will help you configure ZKTeco BioTime server to work with your Node.js Entry/Exit Management System.

## Prerequisites

- ZKTeco BioTime software installed
- Network connectivity between your Node.js server and ZKTeco server
- Admin access to ZKTeco BioTime

## Step 1: ZKTeco BioTime Server Setup

### 1.1 Download and Install ZKTeco BioTime

1. Visit [ZKTeco Official Website](https://www.zkteco.com)
2. Download BioTime software (latest version recommended)
3. Install on Windows Server or Windows machine
4. Follow the installation wizard

### 1.2 Initial Setup

1. Launch ZKTeco BioTime
2. Complete the database setup (PostgreSQL or SQL Server)
3. Create the first admin account
4. Configure basic company settings

### 1.3 Web Interface Access

1. Open web browser
2. Navigate to `http://your-server-ip:8080` (default web interface)
3. Login with admin credentials
4. Verify the interface is working

## Step 2: Enable API Access

### 2.1 API Configuration

1. In ZKTeco BioTime web interface, go to:

   ```
   System Management → System Settings → API Settings
   ```

2. Enable the following options:

   - ✅ Enable REST API
   - ✅ Enable JWT Authentication
   - ✅ Allow External API Access

3. Configure API settings:
   ```
   API Port: 8000 (default)
   API Version: v1
   Authentication: JWT Token
   ```

### 2.2 Create API User

1. Go to `Personnel → Employees`
2. Create a new employee for API access:

   ```
   Employee Code: API_USER
   First Name: API
   Last Name: User
   Email: api@company.com
   ```

3. Go to `System Management → User Management`
4. Create a user account:

   ```
   Username: admin (or your preferred username)
   Password: admin (or your secure password)
   Role: Administrator
   ```

5. Assign necessary permissions:
   - ✅ Employee Management
   - ✅ Attendance Management
   - ✅ API Access
   - ✅ System Settings

## Step 3: Network Configuration

### 3.1 Firewall Settings

Configure Windows Firewall on ZKTeco server:

```cmd
# Open Command Prompt as Administrator
netsh advfirewall firewall add rule name="ZKTeco API" dir=in action=allow protocol=TCP localport=8000
netsh advfirewall firewall add rule name="ZKTeco Web" dir=in action=allow protocol=TCP localport=8080
```

### 3.2 Network Testing

Test connectivity from your Node.js server:

```bash
# Test web interface
curl http://your-zkteco-server:8080

# Test API endpoint
curl http://your-zkteco-server:8000/jwt-api-token-auth/
```

## Step 4: Configure Node.js Application

### 4.1 Update Environment Variables

Edit your `.env` file:

```env
# Replace with your actual ZKTeco server details
ZKTECO_BASE_URL=http://192.168.1.100:8000
ZKTECO_USERNAME=admin
ZKTECO_PASSWORD=your_secure_password

# Optional: Adjust sync settings
ZKTECO_AUTO_SYNC=true
ZKTECO_SYNC_INTERVAL=5
ZKTECO_PULL_ATTENDANCE=true
ZKTECO_DEFAULT_DEPARTMENT=1
ZKTECO_DEFAULT_POSITION=1
```

### 4.2 Configuration Examples

#### For Local Testing:

```env
ZKTECO_BASE_URL=http://localhost:8000
ZKTECO_USERNAME=admin
ZKTECO_PASSWORD=admin
```

#### For Production Environment:

```env
ZKTECO_BASE_URL=https://biotime.yourcompany.com:8000
ZKTECO_USERNAME=api_user
ZKTECO_PASSWORD=secure_api_password_123
```

#### For Cloud/Remote Server:

```env
ZKTECO_BASE_URL=http://203.123.45.67:8000
ZKTECO_USERNAME=integration_user
ZKTECO_PASSWORD=complex_password_456
```

## Step 5: Department and Position Setup

### 5.1 Create Departments in ZKTeco

1. Go to `Personnel → Departments`
2. Create departments that match your organization:

   ```
   ID: 1, Name: General
   ID: 2, Name: Administration
   ID: 3, Name: Security
   ID: 4, Name: Visitors
   ```

3. Note the Department IDs for configuration

### 5.2 Create Positions

1. Go to `Personnel → Positions`
2. Create positions:

   ```
   ID: 1, Name: Employee
   ID: 2, Name: Visitor
   ID: 3, Name: Guest
   ID: 4, Name: Staff
   ```

3. Update your `.env` file:
   ```env
   ZKTECO_DEFAULT_DEPARTMENT=1
   ZKTECO_DEFAULT_POSITION=1
   ```

## Step 6: Test the Integration

### 6.1 Start Your Node.js Application

```bash
cd /path/to/your/app
npm start
```

### 6.2 Access Integration Dashboard

1. Open browser: `http://localhost:3000`
2. Login as admin
3. Navigate to "ZKTeco Integration"

### 6.3 Test Connection

1. Click "Test Connection" button
2. Verify successful connection
3. Check employee and department counts

## Step 7: Common Configuration Issues

### Issue 1: Connection Timeout

**Problem**: Cannot connect to ZKTeco server
**Solutions**:

- Check if ZKTeco BioTime service is running
- Verify firewall settings
- Test network connectivity
- Confirm correct IP address and port

### Issue 2: Authentication Failed

**Problem**: Invalid credentials error
**Solutions**:

- Verify username/password in ZKTeco
- Check user permissions
- Ensure API access is enabled
- Try with default admin account

### Issue 3: API Not Enabled

**Problem**: API endpoints not responding
**Solutions**:

- Enable REST API in ZKTeco settings
- Restart ZKTeco BioTime service
- Check API port configuration
- Verify JWT authentication is enabled

### Issue 4: Permission Denied

**Problem**: API user lacks permissions
**Solutions**:

- Assign administrator role
- Enable specific API permissions
- Check employee management rights
- Verify attendance access permissions

## Step 8: Advanced Configuration

### 8.1 SSL/HTTPS Setup

For production environments, configure HTTPS:

1. Obtain SSL certificate
2. Configure in ZKTeco BioTime
3. Update your Node.js config:
   ```env
   ZKTECO_BASE_URL=https://biotime.company.com:8443
   ```

### 8.2 Load Balancing

For multiple ZKTeco servers:

```env
ZKTECO_PRIMARY_URL=http://biotime1.company.com:8000
ZKTECO_SECONDARY_URL=http://biotime2.company.com:8000
```

### 8.3 Database Optimization

For better performance:

1. Configure database connection pooling
2. Set appropriate timeouts
3. Enable query caching
4. Monitor database performance

## Step 9: Monitoring and Maintenance

### 9.1 Health Checks

Set up monitoring for:

- ZKTeco service status
- API response times
- Database connectivity
- Sync operation success rates

### 9.2 Log Configuration

Configure logging in ZKTeco:

1. Go to `System → Log Settings`
2. Enable API access logs
3. Set log retention period
4. Monitor for errors

### 9.3 Backup Strategy

Regular backups of:

- ZKTeco database
- Configuration files
- Employee photos
- Attendance records

## Step 10: Troubleshooting Commands

### Check ZKTeco Service Status (Windows):

```cmd
sc query ZKBioTimeService
net start ZKBioTimeService
```

### Test API Connectivity:

```bash
curl -X POST http://your-server:8000/jwt-api-token-auth/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

### Check Network Connectivity:

```bash
ping your-zkteco-server
telnet your-zkteco-server 8000
```

## Production Checklist

Before going live, ensure:

- [ ] ZKTeco server is stable and tested
- [ ] Network connectivity is reliable
- [ ] Firewall rules are configured
- [ ] API user has proper permissions
- [ ] SSL certificates are valid (if using HTTPS)
- [ ] Backup procedures are in place
- [ ] Monitoring is configured
- [ ] Error handling is tested
- [ ] Performance is acceptable
- [ ] Documentation is updated

## Support Resources

- **ZKTeco Official Documentation**: Available with software installation
- **API Reference**: Usually at `http://your-server:8000/docs/`
- **Community Forums**: ZKTeco support forums
- **Technical Support**: ZKTeco official support channels

This guide should help you successfully configure ZKTeco BioTime server for integration with your Node.js application.
