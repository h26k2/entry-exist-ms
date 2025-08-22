const axios = require('axios');
const config = require('../config/zkbiotime');

let authToken = null;

/**
 * Get authentication token from ZKBioTime server
 * @returns {Promise<string>} Authentication token
 */
async function getAuthToken() {
    try {
        // If we already have a token, return it
        if (authToken) {
            return authToken;
        }

        // Make API call to get token
        const response = await axios.post(`${config.baseUrl}/api-token-auth/`, {
            username: config.credentials.username,
            password: config.credentials.password
        });

        // Store the token
        authToken = response.data.token;
        return authToken;
    } catch (error) {
        console.error('Failed to get ZKBioTime auth token:', error.message);
        throw new Error('ZKBioTime authentication failed');
    }
}

/**
 * Clear the stored auth token
 */
function clearAuthToken() {
    authToken = null;
}

/**
 * Create an axios instance with authentication headers
 * @returns {Promise<import('axios').AxiosInstance>}
 */
async function createAuthenticatedClient() {
    const token = await getAuthToken();
    return axios.create({
        baseURL: config.baseUrl,
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        }
    });
}

module.exports = {
    getAuthToken,
    clearAuthToken,
    createAuthenticatedClient
};
