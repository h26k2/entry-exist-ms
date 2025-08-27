const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authController = require('../controllers/authController');

// Test route to verify guest routes are working
router.get('/api/test-guest-routes', (req, res) => {
    res.json({
        success: true,
        message: 'Guest routes are working!',
        timestamp: new Date().toISOString()
    });
});

// Get all app users (for host selection)
router.get('/api/app-users', authController.requireLogin, async (req, res) => {
    try {
        
        const query = `
            SELECT id, first_name, last_name, cnic_number 
            FROM app_users 
            ORDER BY first_name, last_name
        `;
        
        const [rows] = await db.execute(query);
        
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching app users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch app users',
            error: error.message
        });
    }
});

// Register a new guest
router.post('/api/guests/register', authController.requireLogin, async (req, res) => {
    try {
        const { first_name, last_name, cnic_number } = req.body;
        
        // Validate required fields
        if (!first_name || !last_name || !cnic_number) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        
        // Validate CNIC format (13 digits)
        if (!/^\d{13}$/.test(cnic_number)) {
            return res.status(400).json({
                success: false,
                message: 'CNIC must be exactly 13 digits'
            });
        }
        
        // Check if guest with this CNIC already exists
        const checkQuery = 'SELECT id FROM app_guests WHERE cnic_number = ?';
        const [existingGuest] = await db.execute(checkQuery, [cnic_number]);
        
        if (existingGuest.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'A guest with this CNIC already exists'
            });
        }
        
        // Insert new guest
        const insertQuery = `
            INSERT INTO app_guests (first_name, last_name, cnic_number) 
            VALUES (?, ?, ?)
        `;
        
        const [insertResult] = await db.execute(insertQuery, [first_name, last_name, cnic_number]);
        
        res.json({
            success: true,
            message: 'Guest registered successfully',
            data: {
                guest_id: insertResult.insertId,
                first_name,
                last_name,
                cnic_number
            }
        });
        
    } catch (error) {
        console.error('Error registering guest:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'A guest with this CNIC already exists'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to register guest'
        });
    }
});

// Get all guests for check-in selection
router.get('/api/guests/list', authController.requireLogin, async (req, res) => {
    try {
        const query = `
            SELECT id, first_name, last_name, cnic_number 
            FROM app_guests 
            ORDER BY first_name, last_name
        `;
        
        const [rows] = await db.execute(query);
        
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching guests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch guests',
            error: error.message
        });
    }
});

// Get all app users for host selection
router.get('/api/app-users/hosts', authController.requireLogin, async (req, res) => {
    try {
        const query = `
            SELECT id, first_name, last_name, cnic_number 
            FROM app_users 
            ORDER BY first_name, last_name
        `;
        
        const [rows] = await db.execute(query);
        
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching hosts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch hosts',
            error: error.message
        });
    }
});

// Guest check-in
router.post('/api/guests/checkin', authController.requireLogin, async (req, res) => {
    try {
        const { guest_id, guest_of } = req.body;
        
        // Validate required fields
        if (!guest_id || !guest_of) {
            return res.status(400).json({
                success: false,
                message: 'Guest ID and Host ID are required'
            });
        }
        
        // Verify guest exists
        const guestQuery = 'SELECT id, first_name, last_name FROM app_guests WHERE id = ?';
        const [guestExists] = await db.execute(guestQuery, [guest_id]);
        
        if (guestExists.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Guest not found'
            });
        }
        
        // Verify host exists
        const hostQuery = 'SELECT id, first_name, last_name FROM app_users WHERE id = ?';
        const [hostExists] = await db.execute(hostQuery, [guest_of]);
        
        if (hostExists.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Host not found'
            });
        }
        
        // Check if guest is already checked in
        const checkInQuery = `
            SELECT id FROM guest_transactions 
            WHERE guest_id = ? AND checked_in = true AND checked_out = false
        `;
        const [alreadyCheckedIn] = await db.execute(checkInQuery, [guest_id]);
        
        if (alreadyCheckedIn.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Guest is already checked in'
            });
        }
        
        // Insert guest transaction record
        const insertQuery = `
            INSERT INTO guest_transactions (guest_id, guest_of, checked_in, check_in_time) 
            VALUES (?, ?, true, NOW())
        `;
        
        const [insertResult] = await db.execute(insertQuery, [guest_id, guest_of]);
        
        const guest = guestExists[0];
        const host = hostExists[0];
        
        res.json({
            success: true,
            message: 'Guest checked in successfully',
            data: {
                transaction_id: insertResult.insertId,
                guest_name: `${guest.first_name} ${guest.last_name}`,
                host_name: `${host.first_name} ${host.last_name}`
            }
        });
        
    } catch (error) {
        console.error('Error checking in guest:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check in guest'
        });
    }
});

// Get checked-in guests for checkout
router.get('/api/guests/checked-in', authController.requireLogin, async (req, res) => {
    try {
        const query = `
            SELECT 
                gt.id as transaction_id,
                gt.guest_id,
                gt.guest_of,
                gt.check_in_time,
                g.first_name as guest_first_name,
                g.last_name as guest_last_name,
                g.cnic_number as guest_cnic,
                u.first_name as host_first_name,
                u.last_name as host_last_name,
                u.cnic_number as host_cnic
            FROM guest_transactions gt
            JOIN app_guests g ON gt.guest_id = g.id
            JOIN app_users u ON gt.guest_of = u.id
            WHERE gt.checked_in = 1 AND gt.checked_out = 0
            ORDER BY gt.check_in_time DESC
        `;
        
        const [rows] = await db.execute(query);
        
        // Format the data for frontend
        const formattedData = rows.map(row => ({
            transaction_id: row.transaction_id,
            guest_id: row.guest_id,
            guest_name: `${row.guest_first_name} ${row.guest_last_name}`,
            guest_cnic: row.guest_cnic,
            host_name: `${row.host_first_name} ${row.host_last_name}`,
            host_cnic: row.host_cnic,
            check_in_time: row.check_in_time
        }));
        
        res.json({
            success: true,
            data: formattedData
        });
    } catch (error) {
        console.error('Error fetching checked-in guests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch checked-in guests',
            error: error.message
        });
    }
});

// Guest checkout
router.post('/api/guests/checkout', authController.requireLogin, async (req, res) => {
    try {
        const { transaction_id } = req.body;
        
        // Validate required field
        if (!transaction_id) {
            return res.status(400).json({
                success: false,
                message: 'Transaction ID is required'
            });
        }
        
        // Verify transaction exists and is checked in
        const checkQuery = `
            SELECT gt.id, g.first_name, g.last_name, u.first_name as host_first_name, u.last_name as host_last_name
            FROM guest_transactions gt
            JOIN app_guests g ON gt.guest_id = g.id
            JOIN app_users u ON gt.guest_of = u.id
            WHERE gt.id = ? AND gt.checked_in = 1 AND gt.checked_out = 0
        `;
        const [transactionExists] = await db.execute(checkQuery, [transaction_id]);
        
        if (transactionExists.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction or guest already checked out'
            });
        }
        
        // Update transaction to checkout
        const updateQuery = `
            UPDATE guest_transactions 
            SET checked_out = 1, check_out_time = NOW() 
            WHERE id = ?
        `;
        
        await db.execute(updateQuery, [transaction_id]);
        
        const transaction = transactionExists[0];
        const guestName = `${transaction.first_name} ${transaction.last_name}`;
        const hostName = `${transaction.host_first_name} ${transaction.host_last_name}`;
        
        res.json({
            success: true,
            message: 'Guest checked out successfully',
            data: {
                guest_name: guestName,
                host_name: hostName
            }
        });
        
    } catch (error) {
        console.error('Error checking out guest:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check out guest'
        });
    }
});

// Get all guests
router.get('/api/guests', authController.requireLogin, async (req, res) => {
    try {
        const query = `
            SELECT 
                g.id,
                g.first_name,
                g.last_name,
                g.cnic_number,
                g.created_at,
                gt.guest_of,
                gt.checked_in,
                gt.checked_out,
                gt.check_in_time,
                gt.check_out_time,
                CONCAT(u.first_name, ' ', u.last_name) as host_name
            FROM app_guests g
            LEFT JOIN guest_transactions gt ON g.id = gt.guest_id
            LEFT JOIN app_users u ON gt.guest_of = u.id
            ORDER BY g.created_at DESC
        `;
        
        const [rows] = await db.execute(query);
        
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching guests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch guests'
        });
    }
});

// Get today's guest statistics (check-ins and check-outs)
router.get('/api/guest-stats', authController.requireLogin, async (req, res) => {
    try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Count today's guest check-ins
        const checkinQuery = `
            SELECT COUNT(*) as count 
            FROM guest_transactions 
            WHERE checked_in = TRUE 
            AND DATE(check_in_time) = ?
        `;
        
        // Count today's guest check-outs
        const checkoutQuery = `
            SELECT COUNT(*) as count 
            FROM guest_transactions 
            WHERE checked_out = TRUE 
            AND DATE(check_out_time) = ?
        `;
        
        const [checkinResult] = await db.execute(checkinQuery, [today]);
        const [checkoutResult] = await db.execute(checkoutQuery, [today]);
        
        res.json({
            success: true,
            checkins: checkinResult[0].count,
            checkouts: checkoutResult[0].count,
            date: today
        });
    } catch (error) {
        console.error('Error fetching guest statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch guest statistics',
            error: error.message
        });
    }
});

module.exports = router;
