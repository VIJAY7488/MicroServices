const logger = require('../utils/logger');


const errorHandler = (err, req, res, next) => {
    logger.error(`Error: ${err.message}, Stack: ${err.stack}`);

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
}

module.exports = errorHandler;