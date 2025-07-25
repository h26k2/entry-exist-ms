const bcrypt = require('bcrypt');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the password to hash: ', async (plainPassword) => {
  try {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    console.log('\nHashed password ready to use in your SQL query:\n');
    console.log(`==>${hashedPassword}<==`);
  } catch (error) {
    console.error('Error hashing password:', error);
  } finally {
    rl.close();
  }
});