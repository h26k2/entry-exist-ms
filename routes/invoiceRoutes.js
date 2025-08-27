const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

// Get users for invoice generation
router.get('/api/invoice/users', invoiceController.getUsersForInvoice);

// Get recent invoices
router.get('/api/invoice/recent', invoiceController.getRecentInvoices);

// Get invoice details
router.get('/api/invoice/:id', invoiceController.getInvoiceDetails);

// Download invoice as PDF
router.get('/api/invoice/:id/download', invoiceController.downloadInvoicePDF);

// Mark invoice as paid
router.put('/api/invoice/:id/mark-paid', invoiceController.markInvoiceAsPaid);

// Check existing invoices
router.get('/api/invoice/check-existing', invoiceController.checkExistingInvoices);

// Generate single invoice
router.post('/api/invoice/generate-single', invoiceController.generateSingleInvoice);

// Generate all invoices
router.post('/api/invoice/generate-all', invoiceController.generateAllInvoices);

module.exports = router;
