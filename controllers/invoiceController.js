const db = require('../config/db');

// Helper function to generate invoice HTML for PDF
function generateInvoiceHTML(invoice, items) {
    const currentDate = new Date().toLocaleDateString();
    const generatedDate = new Date(invoice.generated_on).toLocaleDateString();
    const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A';
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Invoice ${invoice.invoice_number}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
                .company-name { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 5px; }
                .company-tagline { font-size: 14px; color: #666; }
                .invoice-title { font-size: 24px; font-weight: bold; margin: 20px 0; }
                .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .invoice-info, .client-info { width: 48%; }
                .info-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #2563eb; }
                .info-row { margin-bottom: 5px; }
                .label { font-weight: bold; display: inline-block; width: 120px; }
                .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                .items-table th { background-color: #f8f9fa; font-weight: bold; }
                .items-table .amount { text-align: right; }
                .summary { margin-top: 30px; float: right; width: 300px; }
                .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0; }
                .summary-total { border-top: 2px solid #2563eb; font-weight: bold; font-size: 18px; color: #2563eb; }
                .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
                .status-pending { background-color: #fef3c7; color: #d69e2e; }
                .status-paid { background-color: #d1fae5; color: #065f46; }
                .status-overdue { background-color: #fee2e2; color: #dc2626; }
                .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
                .clearfix::after { content: ""; display: table; clear: both; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-name">Charging Bull Sports Complex</div>
                <div class="company-tagline">Malir Cantonment, Karachi, Pakistan</div>
            </div>

            <div class="invoice-title">INVOICE</div>

            <div class="invoice-details">
                <div class="invoice-info">
                    <div class="info-title">Invoice Information</div>
                    <div class="info-row"><span class="label">Invoice #:</span> ${invoice.invoice_number}</div>
                    <div class="info-row"><span class="label">Generated:</span> ${generatedDate}</div>
                    <div class="info-row"><span class="label">Due Date:</span> ${dueDate}</div>
                    <div class="info-row"><span class="label">Status:</span> 
                        <span class="status status-${invoice.status}">${invoice.status.toUpperCase()}</span>
                    </div>
                </div>
                <div class="client-info">
                    <div class="info-title">Bill To</div>
                    <div class="info-row"><span class="label">Name:</span> ${invoice.client_name}</div>
                    <div class="info-row"><span class="label">CNIC:</span> ${invoice.cnic_number}</div>
                    <div class="info-row"><span class="label">User ID:</span> ${invoice.user_id}</div>
                    <div class="info-row"><span class="label">Billing Month:</span> ${invoice.month}</div>
                </div>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th class="amount">Unit Price</th>
                        <th class="amount">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${item.description}</td>
                            <td>${item.quantity}</td>
                            <td class="amount">Rs. ${parseFloat(item.unit_price).toFixed(2)}</td>
                            <td class="amount">Rs. ${parseFloat(item.total_price).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="clearfix">
                <div class="summary">
                    <div class="summary-row">
                        <span>Subtotal:</span>
                        <span>Rs. ${parseFloat(invoice.total_amount).toFixed(2)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Discount:</span>
                        <span>- Rs. ${parseFloat(invoice.discount || 0).toFixed(2)}</span>
                    </div>
                    <div class="summary-row summary-total">
                        <span>Total Amount:</span>
                        <span>Rs. ${parseFloat(invoice.payable_amount).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div class="footer">
                <p>Thank you for using our facility management services!</p>
                <p>For any queries regarding this invoice, please contact the administration.</p>
                <p>Generated on ${currentDate}</p>
            </div>
        </body>
        </html>
    `;
}

const invoiceController = {
    // Get users who have availed facilities for invoice generation
    getUsersForInvoice: async (req, res) => {
        try {
            const query = `
                SELECT DISTINCT 
                    u.id,
                    u.first_name,
                    u.last_name,
                    u.cnic_number,
                    COUNT(DISTINCT fur.facility_id) as facility_count,
                    SUM(f.price) as total_amount
                FROM app_users u
                INNER JOIN facilities_user_relations fur ON u.id = fur.user_id
                INNER JOIN facilities f ON fur.facility_id = f.id
                WHERE f.is_deleted = FALSE
                GROUP BY u.id, u.first_name, u.last_name, u.cnic_number
                ORDER BY u.first_name, u.last_name
            `;

            const [users] = await db.execute(query);
            
            // Get detailed facility information for each user
            for (let user of users) {
                const facilityQuery = `
                    SELECT 
                        f.id,
                        f.name,
                        f.price
                    FROM facilities f
                    INNER JOIN facilities_user_relations fur ON f.id = fur.facility_id
                    WHERE fur.user_id = ? AND f.is_deleted = FALSE
                `;
                const [facilities] = await db.execute(facilityQuery, [user.id]);
                user.facilities = facilities;
            }

            res.json({
                success: true,
                users: users
            });
        } catch (error) {
            console.error('Error fetching users for invoice:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching users for invoice generation'
            });
        }
    },

    // Mark invoice as paid
    markInvoiceAsPaid: async (req, res) => {
        try {
            const { id } = req.params;
            const { payment_method, payment_reference, notes } = req.body;

            // Check if invoice exists
            const [invoiceCheck] = await db.execute('SELECT id, status FROM invoices WHERE id = ?', [id]);
            
            if (invoiceCheck.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Invoice not found'
                });
            }

            if (invoiceCheck[0].status === 'paid') {
                return res.status(400).json({
                    success: false,
                    message: 'Invoice is already marked as paid'
                });
            }

            // Update invoice as paid
            const updateQuery = `
                UPDATE invoices 
                SET 
                    status = 'paid',
                    received = TRUE,
                    received_on = CURRENT_TIMESTAMP,
                    payment_method = ?,
                    payment_reference = ?,
                    notes = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            await db.execute(updateQuery, [
                payment_method || null,
                payment_reference || null,
                notes || null,
                id
            ]);

            res.json({
                success: true,
                message: 'Invoice marked as paid successfully'
            });

        } catch (error) {
            console.error('Error marking invoice as paid:', error);
            res.status(500).json({
                success: false,
                message: 'Error marking invoice as paid'
            });
        }
    },

    // Generate and download invoice PDF
    downloadInvoicePDF: async (req, res) => {
        try {
            const { id } = req.params;

            // Get invoice details (reuse existing logic)
            const invoiceQuery = `
                SELECT 
                    i.*,
                    CONCAT(u.first_name, ' ', u.last_name) as client_name,
                    u.cnic_number,
                    u.id as user_id,
                    CONCAT(creator.first_name, ' ', creator.last_name) as created_by_name
                FROM invoices i
                INNER JOIN app_users u ON i.u_id = u.id
                LEFT JOIN app_users creator ON i.created_by = creator.id
                WHERE i.id = ?
            `;

            const [invoiceResult] = await db.execute(invoiceQuery, [id]);

            if (invoiceResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Invoice not found'
                });
            }

            const invoice = invoiceResult[0];

            // Get invoice items
            const itemsQuery = `
                SELECT 
                    ii.*,
                    f.name as facility_name
                FROM invoice_items ii
                LEFT JOIN facilities f ON ii.facility_id = f.id
                WHERE ii.invoice_id = ?
                ORDER BY ii.id
            `;

            const [items] = await db.execute(itemsQuery, [id]);

            // Generate HTML for PDF
            const htmlContent = generateInvoiceHTML(invoice, items);

            // For now, return HTML content that can be converted to PDF on frontend
            // Later can be enhanced with server-side PDF generation using libraries like puppeteer
            res.json({
                success: true,
                invoice: {
                    ...invoice,
                    items: items
                },
                htmlContent: htmlContent
            });

        } catch (error) {
            console.error('Error generating invoice PDF:', error);
            res.status(500).json({
                success: false,
                message: 'Error generating invoice PDF'
            });
        }
    },

    // Get detailed invoice information
    getInvoiceDetails: async (req, res) => {
        try {
            const { id } = req.params;

            // Get invoice details
            const invoiceQuery = `
                SELECT 
                    i.*,
                    CONCAT(u.first_name, ' ', u.last_name) as client_name,
                    u.cnic_number,
                    u.id as user_id,
                    CONCAT(creator.first_name, ' ', creator.last_name) as created_by_name
                FROM invoices i
                INNER JOIN app_users u ON i.u_id = u.id
                LEFT JOIN app_users creator ON i.created_by = creator.id
                WHERE i.id = ?
            `;

            const [invoiceResult] = await db.execute(invoiceQuery, [id]);

            if (invoiceResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Invoice not found'
                });
            }

            const invoice = invoiceResult[0];

            // Get invoice items
            const itemsQuery = `
                SELECT 
                    ii.*,
                    f.name as facility_name
                FROM invoice_items ii
                LEFT JOIN facilities f ON ii.facility_id = f.id
                WHERE ii.invoice_id = ?
                ORDER BY ii.id
            `;

            const [items] = await db.execute(itemsQuery, [id]);

            res.json({
                success: true,
                invoice: {
                    ...invoice,
                    items: items
                }
            });
        } catch (error) {
            console.error('Error fetching invoice details:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching invoice details'
            });
        }
    },

    // Get recent invoices for display
    getRecentInvoices: async (req, res) => {
        try {
            const { limit = 10, offset = 0, search = '', status = '' } = req.query;

            // Build the WHERE clause for search and filter
            let whereClause = 'WHERE 1=1';
            let queryParams = [];

            // Add search functionality
            if (search.trim()) {
                whereClause += ' AND (i.invoice_number LIKE ? OR CONCAT(u.first_name, " ", u.last_name) LIKE ? OR u.cnic_number LIKE ?)';
                const searchPattern = `%${search.trim()}%`;
                queryParams.push(searchPattern, searchPattern, searchPattern);
            }

            // Add status filter
            if (status.trim()) {
                whereClause += ' AND i.status = ?';
                queryParams.push(status.trim());
            }

            const query = `
                SELECT 
                    i.id,
                    i.invoice_number,
                    i.month,
                    i.total_amount,
                    i.payable_amount,
                    i.status,
                    i.generated_on,
                    i.due_date,
                    CONCAT(u.first_name, ' ', u.last_name) as client_name,
                    u.cnic_number
                FROM invoices i
                INNER JOIN app_users u ON i.u_id = u.id
                ${whereClause}
                ORDER BY i.generated_on DESC
                LIMIT ? OFFSET ?
            `;

            queryParams.push(parseInt(limit), parseInt(offset));
            const [invoices] = await db.execute(query, queryParams);

            // Get total count for pagination with same filters
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM invoices i
                INNER JOIN app_users u ON i.u_id = u.id
                ${whereClause}
            `;
            
            const countParams = queryParams.slice(0, -2); // Remove limit and offset
            const [countResult] = await db.execute(countQuery, countParams);
            const totalInvoices = countResult[0].total;

            res.json({
                success: true,
                invoices: invoices,
                pagination: {
                    total: totalInvoices,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + invoices.length) < totalInvoices
                },
                filters: {
                    search: search,
                    status: status
                }
            });
        } catch (error) {
            console.error('Error fetching recent invoices:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching recent invoices'
            });
        }
    },

    // Check existing invoices for a month/year
    checkExistingInvoices: async (req, res) => {
        try {
            const { month, year } = req.query;
            const monthYear = `${month.toLowerCase()} ${year}`;

            const query = `
                SELECT 
                    i.id,
                    i.invoice_number,
                    i.month,
                    i.total_amount,
                    i.status,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name,
                    u.cnic_number
                FROM invoices i
                INNER JOIN app_users u ON i.u_id = u.id
                WHERE i.month = ?
                ORDER BY i.created_at DESC
            `;

            const [invoices] = await db.execute(query, [monthYear]);

            res.json({
                success: true,
                invoices: invoices
            });
        } catch (error) {
            console.error('Error checking existing invoices:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking existing invoices'
            });
        }
    },

    // Generate invoice for a single user
    generateSingleInvoice: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { user_id, month, year } = req.body;
            
            console.log('Received invoice generation request:', { user_id, month, year });

            // Validation
            if (!user_id || !month || !year) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: user_id, month, or year'
                });
            }
            
            // Check if invoice already exists for this user and month
            const [existingInvoice] = await connection.execute(
                'SELECT id FROM invoices WHERE u_id = ? AND month = ?',
                [user_id, `${month.toLowerCase()} ${year}`]
            );

            if (existingInvoice.length > 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Invoice already exists for this user and month'
                });
            }

            // Get user facilities and calculate total
            const [facilities] = await connection.execute(`
                SELECT 
                    f.id,
                    f.name,
                    f.price
                FROM facilities f
                INNER JOIN facilities_user_relations fur ON f.id = fur.facility_id
                WHERE fur.user_id = ? AND f.is_deleted = FALSE
            `, [user_id]);

            if (facilities.length === 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'No facilities found for this user'
                });
            }

            const total_amount = facilities.reduce((sum, facility) => sum + parseFloat(facility.price), 0);
            const discount = 0; // No discount rules currently
            const payable_amount = total_amount - discount;

            // Calculate due date (next month 15th)
            const currentDate = new Date();
            const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 15);
            const due_date = nextMonth.toISOString().split('T')[0];

            // Insert invoice
            const [invoiceResult] = await connection.execute(`
                INSERT INTO invoices (
                    invoice_number, month, u_id, total_amount, discount, 
                    payable_amount, due_date, created_by, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
            `, [
                `270825_CB_INV_${Date.now()}`, // Temporary, will update with actual ID
                `${month.toLowerCase()} ${year}`,
                user_id,
                total_amount,
                discount,
                payable_amount,
                due_date,
                req.session.user?.id || 'admin'
            ]);

            const invoice_id = invoiceResult.insertId;

            // Update invoice number with actual ID
            const invoice_number = `270825_CB_INV_${invoice_id}`;
            await connection.execute(
                'UPDATE invoices SET invoice_number = ? WHERE id = ?',
                [invoice_number, invoice_id]
            );

            // Insert invoice items
            for (const facility of facilities) {
                await connection.execute(`
                    INSERT INTO invoice_items (
                        invoice_id, facility_id, description, quantity, 
                        unit_price, total_price
                    ) VALUES (?, ?, ?, 1, ?, ?)
                `, [
                    invoice_id,
                    facility.id,
                    facility.name,
                    facility.price,
                    facility.price
                ]);
            }

            await connection.commit();

            res.json({
                success: true,
                message: 'Invoice generated successfully',
                invoice: {
                    id: invoice_id,
                    invoice_number: invoice_number,
                    total_amount: total_amount,
                    payable_amount: payable_amount
                }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error generating invoice:', error);
            res.status(500).json({
                success: false,
                message: 'Error generating invoice'
            });
        } finally {
            connection.release();
        }
    },

    // Generate invoices for all users
    generateAllInvoices: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { month, year } = req.body;
            const monthYear = `${month.toLowerCase()} ${year}`;

            // Get all users who have facilities
            const [users] = await connection.execute(`
                SELECT DISTINCT 
                    u.id,
                    u.first_name,
                    u.last_name
                FROM app_users u
                INNER JOIN facilities_user_relations fur ON u.id = fur.user_id
                INNER JOIN facilities f ON fur.facility_id = f.id
                WHERE f.is_deleted = FALSE
            `);

            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            for (const user of users) {
                try {
                    // Check if invoice already exists
                    const [existingInvoice] = await connection.execute(
                        'SELECT id FROM invoices WHERE u_id = ? AND month = ?',
                        [user.id, monthYear]
                    );

                    if (existingInvoice.length > 0) {
                        errors.push(`Invoice already exists for ${user.first_name} ${user.last_name}`);
                        errorCount++;
                        continue;
                    }

                    // Get user facilities
                    const [facilities] = await connection.execute(`
                        SELECT 
                            f.id,
                            f.name,
                            f.price
                        FROM facilities f
                        INNER JOIN facilities_user_relations fur ON f.id = fur.facility_id
                        WHERE fur.user_id = ? AND f.is_deleted = FALSE
                    `, [user.id]);

                    if (facilities.length === 0) {
                        errors.push(`No facilities found for ${user.first_name} ${user.last_name}`);
                        errorCount++;
                        continue;
                    }

                    const total_amount = facilities.reduce((sum, facility) => sum + parseFloat(facility.price), 0);
                    const discount = 0;
                    const payable_amount = total_amount - discount;

                    // Calculate due date
                    const currentDate = new Date();
                    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 15);
                    const due_date = nextMonth.toISOString().split('T')[0];

                    // Insert invoice
                    const [invoiceResult] = await connection.execute(`
                        INSERT INTO invoices (
                            invoice_number, month, u_id, total_amount, discount, 
                            payable_amount, due_date, created_by, status
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
                    `, [
                        `270825_CB_INV_${Date.now()}_${user.id}`,
                        monthYear,
                        user.id,
                        total_amount,
                        discount,
                        payable_amount,
                        due_date,
                        req.session.user?.id || 'admin'
                    ]);

                    const invoice_id = invoiceResult.insertId;

                    // Update invoice number with actual ID
                    const invoice_number = `270825_CB_INV_${invoice_id}`;
                    await connection.execute(
                        'UPDATE invoices SET invoice_number = ? WHERE id = ?',
                        [invoice_number, invoice_id]
                    );

                    // Insert invoice items
                    for (const facility of facilities) {
                        await connection.execute(`
                            INSERT INTO invoice_items (
                                invoice_id, facility_id, description, quantity, 
                                unit_price, total_price
                            ) VALUES (?, ?, ?, 1, ?, ?)
                        `, [
                            invoice_id,
                            facility.id,
                            facility.name,
                            facility.price,
                            facility.price
                        ]);
                    }

                    successCount++;

                } catch (userError) {
                    console.error(`Error generating invoice for user ${user.id}:`, userError);
                    errors.push(`Error generating invoice for ${user.first_name} ${user.last_name}`);
                    errorCount++;
                }
            }

            await connection.commit();

            res.json({
                success: true,
                message: `Invoice generation completed. ${successCount} successful, ${errorCount} errors.`,
                summary: {
                    successCount,
                    errorCount,
                    errors: errors.slice(0, 10) // Limit to first 10 errors
                }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error generating all invoices:', error);
            res.status(500).json({
                success: false,
                message: 'Error generating invoices'
            });
        } finally {
            connection.release();
        }
    }
};

module.exports = invoiceController;
