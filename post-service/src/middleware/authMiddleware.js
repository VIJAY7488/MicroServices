const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');


const authenticateRequest = (req, res, next) => {
    const userId = req.headers['x-user-id'];

    if( !userId ) {
        logger.error('User ID not found in request headers');
        return res.status(401).json({ success: false, message: 'Unauthorized! Please login to continue' });
    };

    req.user = { userId };
    logger.info(`User authenticated with ID: ${userId}`);
    next();
};

module.exports = authenticateRequest;