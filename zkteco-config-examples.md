# ZKTeco Configuration Examples

## Example 1: Local Development (ZKTeco on same machine)

```env
ZKTECO_BASE_URL=http://localhost:8000
ZKTECO_USERNAME=admin
ZKTECO_PASSWORD=admin
```

## Example 2: Local Network (ZKTeco on different machine)

```env
ZKTECO_BASE_URL=http://192.168.1.100:8000
ZKTECO_USERNAME=admin
ZKTECO_PASSWORD=your_password
```

## Example 3: Remote Server (ZKTeco on cloud/remote server)

```env
ZKTECO_BASE_URL=http://203.45.67.89:8000
ZKTECO_USERNAME=api_user
ZKTECO_PASSWORD=secure_password_123
```

## Example 4: HTTPS/SSL Configuration

```env
ZKTECO_BASE_URL=https://biotime.company.com:8443
ZKTECO_USERNAME=integration_user
ZKTECO_PASSWORD=complex_password_456
```

## How to Find Your ZKTeco Server Details:

### 1. Find ZKTeco Server IP

- Check the machine where ZKTeco BioTime is installed
- Open Command Prompt and run: `ipconfig`
- Note the IP address

### 2. Verify ZKTeco Service is Running

- Open Services (services.msc)
- Look for "ZKBioTime" service
- Ensure it's running

### 3. Test Web Interface

- Open browser on ZKTeco machine
- Go to: http://localhost:8080
- If it loads, the server is working

### 4. Test API Endpoint

- Open browser and try: http://your-server-ip:8000
- You should see some API response (even if error)

### 5. Common Ports

- Web Interface: 8080
- API Interface: 8000
- Database: 5432 (PostgreSQL) or 1433 (SQL Server)
