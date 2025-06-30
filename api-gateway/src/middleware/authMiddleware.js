const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');


const validateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        logger.error('Authorization header not found');
        return res.status(401).json({ success: false, message: 'Unauthorized! Please login to continue' });
    }
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        logger.error('Token not found in authorization header');
        return res.status(401).json({ success: false, message: 'Unauthorized! Please login to continue' });
    };

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            logger.error('Token verification failed:', err);
            return res.status(403).json({ success: false, message: 'Forbidden! Invalid token' });
        }
        req.user = user;
        logger.info(`User authenticated with ID: ${user.userId}`);
        next();
    })
};

module.exports = validateToken;