require('dotenv').config();

module.exports = {
    baseUrl: 'http://127.0.0.1:8080',
    credentials: {
        username: process.env.ZKBIOTIME_ADMIN_USER,
        password: process.env.ZKBIOTIME_ADMIN_PWD
    }
};
