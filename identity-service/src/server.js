const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const helmet = require('helmet');
const cors = require('cors');
const Redis = require('ioredis');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const identityRouter = require('./routes/identityRoutes');
const errorHandler = require('./middleware/errorHandler');


dotenv.config();


const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    logger.info('Connected to MongoDB');
})
.catch((error) => {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Exit the process if connection fails
});


const redisClient = new Redis(process.env.REDIS_URL); 


// Middleware
app.use(express.json());
app.use(helmet()); // Security middleware
app.use(cors()); // Enable CORS for all routes

app.use((req, res, next) => {
    logger.info(`Request Method: ${req.method}, Request URL: ${req.url}`);
    logger.info(`Request Body: ${JSON.stringify(req.body)}`);
    next();
});


// DDOS Protection
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 10, // 10 requests
    duration: 1, // per second
});

app.use((req, res, next) => {
    rateLimiter.consume(req.ip)
        .then(() => {
            next();
        })
        .catch(() => {
            logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
            res.status(429).json({ success: false, message: 'Too many requests' });
        });
});


// Ip based rate limiting for senseitive routes
const sensitiveRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    keyPrefix: 'sensitive',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        logger.warn(`Sensitive route rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({ success: false, message: 'Too many requests on sensitive route' });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
}); 


// Apply  this sensitive rate limiter to specific routes
app.use('/api/auth/register', sensitiveRateLimiter);


// Routes
app.use('/api/auth', identityRouter);


// Error handling middleware
app.use(errorHandler);


// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});