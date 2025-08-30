const cron = require('node-cron');
const db = require('../config/db');

// Function to expire payments that are older than 35 days
async function expirePayments() {
  try {
    console.log('Checking for expired payments...');
    
    const [result] = await db.execute(`
      UPDATE app_users 
      SET is_paid = FALSE 
      WHERE is_paid = TRUE 
      AND last_payment_date IS NOT NULL 
      AND DATEDIFF(NOW(), last_payment_date) > 35
    `);
    
    if (result.affectedRows > 0) {
      console.log(`Expired payments for ${result.affectedRows} users`);
    } else {
      console.log('No payments expired today');
    }
    
  } catch (error) {
    console.error('Error expiring payments:', error);
  }
}

// Schedule the job to run daily at 2:00 AM
// Format: second minute hour day month dayOfWeek
const schedulePaymentExpiry = () => {
  cron.schedule('0 0 2 * * *', () => {
    console.log('Running daily payment expiry check...');
    expirePayments();
  }, {
    scheduled: true,
    timezone: "Asia/Karachi" // Adjust to your timezone
  });
  
  console.log('Payment expiry cron job scheduled for daily 2:00 AM');
};

// Manual function to check expired payments immediately
const checkExpiredPayments = async () => {
  await expirePayments();
};

module.exports = {
  schedulePaymentExpiry,
  checkExpiredPayments
};
