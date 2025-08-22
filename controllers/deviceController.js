const { createAuthenticatedClient } = require('../utils/zkbiotime');

/**
 * Get devices from ZKBioTime server
 */
async function getDevices() {
    try {
        const client = await createAuthenticatedClient();
        const response = await client.get('/iclock/api/terminals/');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch devices:', error.message);
        throw error;
    }
}

/**
 * Render devices page
 */
async function renderDevicesPage(req, res) {
    try {
        const devicesData = await getDevices();
        
        // Map devices to include all relevant information
        const devices = devicesData.data.map(device => ({
            id: device.id,
            serialNumber: device.sn,
            ipAddress: device.ip_address,
            alias: device.alias,
            lastActivity: device.last_activity,
            terminalName: device.terminal_name,
            firmwareVersion: device.fw_ver,
            state: device.state,
            userCount: device.user_count,
            faceCount: device.face_count,
            transactionCount: device.transaction_count,
            area: device.area ? device.area.area_name : 'Default'
        }));

        res.render('device-management', {
            title: 'Device Management',
            activePage: 'devices',
            devices,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error rendering devices page:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load devices from ZKBioTime server',
            error: error,
            user: req.session.user
        });
    }
}

/**
 * Update device details in ZKBioTime server
 */
async function updateDevice(req, res) {
    try {
        const { id } = req.params;
        const { alias, ip_address } = req.body;
        
        // Get existing device data first
        const existingDevice = await getDevice(id);
        
        if (!existingDevice) {
            throw new Error('Device not found');
        }

        // Prepare update data keeping other fields unchanged
        const updateData = {
            sn: existingDevice.sn,
            alias: alias || existingDevice.alias,
            ip_address: ip_address || existingDevice.ip_address,
            terminal_tz: existingDevice.terminal_tz || 8,
            heartbeat: existingDevice.heartbeat || 10,
            area: existingDevice.area?.id || 1
        };

        // Validate IP address format
        const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipPattern.test(updateData.ip_address)) {
            throw new Error('Invalid IP address format');
        }

        // Send update request to ZKBioTime server
        const client = await createAuthenticatedClient();
        const response = await client.put(`/iclock/api/terminals/${id}/`, updateData);

        if (response.data.code !== 0) {
            throw new Error(`ZKBioTime server error: ${response.data.msg || 'Failed to update device'}`);
        }

        res.json({ 
            success: true, 
            message: 'Device updated successfully',
            data: response.data.data
        });
    } catch (error) {
        console.error('Error updating device:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to update device',
            error: error.message 
        });
    }
}

module.exports = {
    renderDevicesPage,
    updateDevice
};
