const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    defaultMeta: { service: 'post-service' }, 
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.splat(),
        winston.format.json(),
        winston.format.errors({stack: true})
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
        new winston.transports.File({
            filename: 'error.log',
            level: 'error'
        }),
        new winston.transports.File({
            filename: 'combined.log',
        })
    ]
});

module.exports = logger;