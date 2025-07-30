// Script to check if required tables exist in the 'garrison' database
const mysql = require("mysql2/promise");

async function checkTables() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "", // <-- update if you have a password
    database: "garrison",
  });

  const requiredTables = ["cards", "people", "user_categories", "users"];

  const [rows] = await connection.query("SHOW TABLES");
  const existingTables = rows.map((row) => Object.values(row)[0]);

  requiredTables.forEach((table) => {
    if (existingTables.includes(table)) {
      console.log(`✅ Table exists: ${table}`);
    } else {
      console.log(`❌ Table missing: ${table}`);
    }
  });

  await connection.end();
}

checkTables().catch((err) => {
  console.error("Error checking tables:", err.message);
});
