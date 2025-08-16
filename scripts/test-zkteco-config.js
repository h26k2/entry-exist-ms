#!/usr/bin/env node

/**
 * ZKTeco Server Configuration Test
 * This script helps you test and validate your ZKTeco server configuration
 */

require("dotenv").config();
const axios = require("axios");

async function testZKTecoServer() {
  console.log("🔧 ZKTeco Server Configuration Test\n");

  // Get configuration from environment
  const baseURL = process.env.ZKTECO_BASE_URL || "http://localhost:8000";
  const username = process.env.ZKTECO_USERNAME || "admin";
  const password = process.env.ZKTECO_PASSWORD || "admin";

  console.log("📋 Current Configuration:");
  console.log(`   Server URL: ${baseURL}`);
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${"*".repeat(password.length)}\n`);

  // Test 1: Basic connectivity
  console.log("1️⃣ Testing basic connectivity...");
  try {
    const response = await axios.get(baseURL, { timeout: 5000 });
    console.log(`✅ Server is reachable (Status: ${response.status})`);
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      console.log("❌ Connection refused - Server may not be running");
      console.log("   Solutions:");
      console.log("   - Check if ZKTeco BioTime service is running");
      console.log("   - Verify the server IP address and port");
      console.log("   - Check firewall settings");
      return;
    } else if (error.code === "ENOTFOUND") {
      console.log("❌ Server not found - Check the URL");
      console.log("   Solutions:");
      console.log("   - Verify the ZKTECO_BASE_URL in .env file");
      console.log("   - Check if the server IP is correct");
      console.log("   - Ensure network connectivity");
      return;
    } else {
      console.log(`⚠️  Server responded but with error: ${error.message}`);
    }
  }

  // Test 2: Authentication endpoint
  console.log("\n2️⃣ Testing authentication endpoint...");
  try {
    const authURL = `${baseURL}/jwt-api-token-auth/`;
    const response = await axios.post(
      authURL,
      {
        username: username,
        password: password,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      }
    );

    if (response.data.token) {
      console.log("✅ Authentication successful");
      console.log(
        `   Token received: ${response.data.token.substring(0, 20)}...`
      );

      // Test 3: API endpoints with token
      console.log("\n3️⃣ Testing API endpoints...");
      const token = response.data.token;

      try {
        // Test departments endpoint
        const deptResponse = await axios.get(
          `${baseURL}/personnel/api/departments/`,
          {
            headers: { Authorization: `JWT ${token}` },
            timeout: 10000,
          }
        );
        console.log(
          `✅ Departments endpoint working (${
            deptResponse.data.length || 0
          } departments)`
        );

        // Test employees endpoint
        const empResponse = await axios.get(
          `${baseURL}/personnel/api/employees/`,
          {
            headers: { Authorization: `JWT ${token}` },
            timeout: 10000,
          }
        );
        console.log(
          `✅ Employees endpoint working (${
            empResponse.data.length || 0
          } employees)`
        );

        // Test transactions endpoint
        const transResponse = await axios.get(
          `${baseURL}/iclock/api/transactions/`,
          {
            headers: { Authorization: `JWT ${token}` },
            timeout: 10000,
          }
        );
        console.log(
          `✅ Transactions endpoint working (${
            transResponse.data.length || 0
          } transactions)`
        );
      } catch (apiError) {
        console.log(`⚠️  API endpoints error: ${apiError.message}`);
        console.log(
          "   This might be due to permissions or API version differences"
        );
      }
    } else {
      console.log("❌ Authentication failed - No token received");
    }
  } catch (authError) {
    if (authError.response) {
      console.log(
        `❌ Authentication failed (${authError.response.status}): ${authError.response.statusText}`
      );
      if (authError.response.status === 400) {
        console.log("   Solutions:");
        console.log("   - Check username and password");
        console.log("   - Verify user exists in ZKTeco BioTime");
        console.log("   - Ensure user has API access permissions");
      } else if (authError.response.status === 404) {
        console.log("   Solutions:");
        console.log("   - Check if API is enabled in ZKTeco BioTime");
        console.log("   - Verify the API endpoint URL");
        console.log("   - Check ZKTeco BioTime version compatibility");
      }
    } else {
      console.log(`❌ Authentication error: ${authError.message}`);
    }
  }

  console.log("\n📝 Configuration Tips:");
  console.log("");
  console.log("🔧 Common ZKTeco Server URLs:");
  console.log("   Local: http://localhost:8000");
  console.log("   Network: http://192.168.1.100:8000");
  console.log("   Remote: http://your-server-ip:8000");
  console.log("");
  console.log("🔑 Default Credentials:");
  console.log("   Username: admin");
  console.log("   Password: admin (or your admin password)");
  console.log("");
  console.log("🛠️  If tests fail, check:");
  console.log("   1. ZKTeco BioTime service is running");
  console.log("   2. Firewall allows port 8000");
  console.log("   3. API is enabled in ZKTeco settings");
  console.log("   4. User has proper permissions");
  console.log("   5. Network connectivity is working");
}

// Run the test
testZKTecoServer().catch(console.error);
