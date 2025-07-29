const mysql = require("mysql2/promise");

const commonPasswords = ["", "root", "password", "mysql", "123456", "admin"];

async function testConnection() {
  console.log("Testing MySQL connection with common passwords...\n");

  for (const password of commonPasswords) {
    try {
      const connection = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: password,
      });

      console.log(`✅ SUCCESS! Connected with password: "${password}"`);
      console.log("Updating .env file...\n");

      // Test creating database
      await connection.execute("CREATE DATABASE IF NOT EXISTS garrison");
      console.log('✅ Database "garrison" created successfully');

      await connection.end();

      // Update .env file
      const fs = require("fs");
      const envContent = `PORT=3000
DB_TYPE=mysql
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=${password}
DB_NAME=garrison`;

      fs.writeFileSync(".env", envContent);
      console.log("✅ .env file updated with working credentials");

      return;
    } catch (error) {
      console.log(`❌ Failed with password: "${password}"`);
    }
  }

  console.log("\n🚨 Could not connect with any common passwords.");
  console.log(
    "Please check your MySQL Workbench connection settings and update the .env file manually."
  );
}

testConnection().catch(console.error);
