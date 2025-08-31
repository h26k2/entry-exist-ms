const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function addMasterEntriesTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'garrison'
    });

    console.log('Connected to database');

    const sql = fs.readFileSync('./sql/add_master_entries_table.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 50) + '...');
        const [result] = await connection.execute(statement.trim());
        console.log('Result:', result);
      }
    }

    await connection.end();
    console.log('master_entries table added successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

addMasterEntriesTable();
