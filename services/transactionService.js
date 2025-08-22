const { createAuthenticatedClient } = require('../utils/zkbiotime');

/**
 * Get transactions from ZKBioTime server with filtering options
 * @param {Object} options - Filter options for transactions
 * @param {number} options.page - Page number
 * @param {number} options.pageSize - Number of items per page
 * @param {string} options.empCode - Employee code filter
 * @param {string} options.terminalSN - Terminal serial number filter
 * @param {string} options.terminalAlias - Terminal alias filter
 * @param {string} options.startTime - Start time filter (YYYY-MM-DD HH:mm:ss)
 * @param {string} options.endTime - End time filter (YYYY-MM-DD HH:mm:ss)
 */
async function getTransactions(options = {}) {
    try {
        const client = await createAuthenticatedClient();
        const params = new URLSearchParams();
        
        if (options.page) params.append('page', options.page);
        if (options.pageSize) params.append('page_size', options.pageSize);
        if (options.empCode) params.append('emp_code', options.empCode);
        if (options.terminalSN) params.append('terminal_sn', options.terminalSN);
        if (options.terminalAlias) params.append('terminal_alias', options.terminalAlias);
        if (options.startTime) params.append('start_time', options.startTime);
        if (options.endTime) params.append('end_time', options.endTime);

        const response = await client.get(`/iclock/api/transactions/?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch transactions:', error.message);
        throw error;
    }
}

module.exports = {
    getTransactions
};
