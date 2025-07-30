// Script to list all tables in the 'garrison' database
const mysql = require("mysql2/promise");

async function listAllTables() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root@123", // <-- update if you have a password
    database: "garrison",
  });

  const [rows] = await connection.query("SHOW TABLES");
  console.log("Tables in garrison database:");
  rows.forEach((row) => {
    console.log("- " + Object.values(row)[0]);
  });

  await connection.end();
}

listAllTables().catch((err) => {
  console.error("Error listing tables:", err.message);
});
