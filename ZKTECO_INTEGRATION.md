# ZKTeco BioTime Integration Guide

This document explains how to integrate your Entry/Exit Management System with ZKTeco BioTime software server.

## Overview

The ZKTeco integration allows your Node.js application to:

- **Bi-directional sync**: Push entry/exit data to ZKTeco and pull attendance records
- **Employee management**: Sync people from your database as employees in ZKTeco
- **Automatic synchronization**: Real-time sync with configurable intervals
- **Manual operations**: Manual sync and pull operations for specific records

## Prerequisites

1. **ZKTeco BioTime Server**: Running and accessible
2. **API Access**: Valid credentials for ZKTeco BioTime API
3. **Network Connectivity**: Your Node.js server can reach ZKTeco server
4. **Database**: MySQL database with proper permissions

## Installation Steps

### Step 1: Install Dependencies

```bash
npm install axios node-cron
```

### Step 2: Setup ZKTeco Database Schema

Run the ZKTeco setup script:

```bash
node scripts/setup-zkteco.js
```

### Step 3: Configure Environment Variables

Update your `.env` file:

```env
# ZKTeco BioTime Configuration
ZKTECO_BASE_URL=http://your-zkteco-server:8000
ZKTECO_USERNAME=admin
ZKTECO_PASSWORD=your_password

# ZKTeco Integration Settings
ZKTECO_AUTO_SYNC=true
ZKTECO_SYNC_INTERVAL=5
ZKTECO_PULL_ATTENDANCE=true
ZKTECO_DEFAULT_DEPARTMENT=1
ZKTECO_DEFAULT_POSITION=1
```

### Step 4: Restart Application

```bash
npm restart
# or
pm2 restart all
```

## Configuration Options

| Environment Variable        | Description               | Default Value           |
| --------------------------- | ------------------------- | ----------------------- |
| `ZKTECO_BASE_URL`           | ZKTeco BioTime server URL | `http://localhost:8000` |
| `ZKTECO_USERNAME`           | API username              | `admin`                 |
| `ZKTECO_PASSWORD`           | API password              | `admin`                 |
| `ZKTECO_AUTO_SYNC`          | Enable automatic sync     | `true`                  |
| `ZKTECO_SYNC_INTERVAL`      | Sync interval in minutes  | `5`                     |
| `ZKTECO_PULL_ATTENDANCE`    | Enable attendance pulling | `true`                  |
| `ZKTECO_DEFAULT_DEPARTMENT` | Default department ID     | `1`                     |
| `ZKTECO_DEFAULT_POSITION`   | Default position ID       | `1`                     |

## Usage

### Accessing the Integration Panel

1. Navigate to `/zkteco` in your application
2. Only admin users can access this panel
3. The panel shows sync status, statistics, and controls

### Key Features

#### 1. Connection Testing

- Test connectivity to ZKTeco server
- Verify credentials and API access

#### 2. People Synchronization

- **Sync All People**: Push all people from local database to ZKTeco as employees
- **Auto Sync**: New people are automatically synced when created

#### 3. Entry/Exit Synchronization

- **Real-time Sync**: Entry/exit records are synced immediately when created
- **Batch Sync**: Sync unsynced records in batches
- **Bi-directional**: Pull attendance records from ZKTeco

#### 4. Manual Operations

- **Manual Entry Sync**: Manually sync specific person's entry/exit
- **Pull Attendance**: Import attendance data from ZKTeco for specific date range

## API Endpoints

### ZKTeco Routes

- `GET /zkteco` - Integration dashboard
- `POST /zkteco/test-connection` - Test ZKTeco connection
- `POST /zkteco/sync-all-people` - Sync all people (admin only)
- `POST /zkteco/sync-person` - Sync specific person (admin only)
- `POST /zkteco/sync-unsynced-entries` - Sync unsynced entries (admin only)
- `POST /zkteco/pull-attendance` - Pull attendance from ZKTeco
- `POST /zkteco/manual-entry-sync` - Manual entry/exit sync
- `GET /zkteco/employees` - Get ZKTeco employees
- `GET /zkteco/transactions` - Get ZKTeco transactions
- `GET /zkteco/sync-status` - Get sync status

### Data Flow

#### People Sync (Local → ZKTeco)

```
Local Person → ZKTeco Employee
- CNIC → emp_code
- Name → first_name + last_name
- Phone → mobile
- Email → auto-generated
```

#### Entry/Exit Sync (Local → ZKTeco)

```
Entry Log → ZKTeco Transaction
- Entry → punch_state: 0 (Check In)
- Exit → punch_state: 1 (Check Out)
- Timestamp → punch_time
- CNIC → emp_code
```

#### Attendance Pull (ZKTeco → Local)

```
ZKTeco Transaction → Entry Log
- Check In → Entry record
- Check Out → Exit timestamp update
- Employee → Person lookup by CNIC
```

## Database Schema Changes

The integration adds these fields to existing tables:

### People Table

- `zkteco_employee_id` - ZKTeco employee ID
- `zkteco_synced` - Sync status flag
- `zkteco_last_sync` - Last sync timestamp

### Entry Logs Table

- `zkteco_synced` - Sync status flag
- `zkteco_transaction_id` - ZKTeco transaction ID
- `zkteco_exit_transaction_id` - Exit transaction ID
- `zkteco_sync_time` - Sync timestamp

### New Tables

- `zkteco_sync_logs` - Sync operation logs
- `zkteco_config` - Configuration settings

## Scheduled Tasks

When auto-sync is enabled, these tasks run automatically:

1. **Entry/Exit Sync** - Every 5 minutes (configurable)

   - Syncs unsynced entry/exit records to ZKTeco

2. **Attendance Pull** - Every 10 minutes

   - Pulls new attendance records from ZKTeco

3. **People Sync** - Every hour
   - Syncs new people to ZKTeco as employees

## Troubleshooting

### Connection Issues

1. **Check Server URL**: Verify `ZKTECO_BASE_URL` is correct
2. **Test Credentials**: Use ZKTeco web interface to verify username/password
3. **Network Access**: Ensure your server can reach ZKTeco server
4. **Firewall**: Check if any firewall is blocking the connection

### Sync Issues

1. **Check Logs**: Monitor console output for error messages
2. **Database Permissions**: Ensure database user has necessary permissions
3. **ZKTeco Permissions**: Verify API user has employee and attendance permissions
4. **Data Validation**: Check if person data meets ZKTeco requirements

### Common Error Messages

- `Authentication failed` - Check username/password
- `Employee already exists` - Person already synced to ZKTeco
- `Department not found` - Check `ZKTECO_DEFAULT_DEPARTMENT` setting
- `Connection timeout` - Check network connectivity

## Performance Considerations

1. **Batch Size**: Large sync operations are processed in batches
2. **Rate Limiting**: Sync operations include delays to avoid overwhelming ZKTeco
3. **Error Handling**: Failed syncs are logged and can be retried
4. **Resource Usage**: Scheduled tasks use minimal resources

## Security Notes

1. **Secure Credentials**: Store ZKTeco credentials securely
2. **Network Security**: Use HTTPS when possible
3. **Database Access**: Limit database permissions to necessary operations
4. **Admin Access**: Only admin users can perform bulk sync operations

## Best Practices

1. **Test Environment**: Test integration in development first
2. **Backup Data**: Backup databases before major sync operations
3. **Monitor Logs**: Regularly check sync logs for issues
4. **Regular Maintenance**: Clean up old sync logs periodically
5. **Documentation**: Keep track of ZKTeco employee ID mappings

## Support

For issues or questions:

1. Check the integration dashboard at `/zkteco`
2. Review sync logs in the database
3. Verify ZKTeco server status
4. Check console output for detailed error messages
5. Test connection using the built-in test feature

## Version Compatibility

- **ZKTeco BioTime**: 8.0 and later
- **Node.js**: 16.0 and later
- **MySQL**: 5.7 and later

## API Reference

The integration uses ZKTeco BioTime REST API endpoints:

- `/jwt-api-token-auth/` - Authentication
- `/personnel/api/employees/` - Employee management
- `/personnel/api/departments/` - Department information
- `/iclock/api/transactions/` - Attendance transactions

Refer to ZKTeco BioTime API documentation for detailed endpoint specifications.
