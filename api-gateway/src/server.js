const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const Redis = require('ioredis');
const { RedisStore } = require('rate-limit-redis');
const { rateLimit } = require('express-rate-limit');
const logger = require('./utils/logger');
const proxy = require('express-http-proxy');
const errorrHandler = require('./middleware/errorHandler');


const app = express();
dotenv.config();

const redisClient = new Redis(process.env.REDIS_URL);


// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());


// Rate Limiting
const ratelimit = rateLimit({
    max: 100, // limit each IP to 100 requests per windowMs
    windowMs: 15 * 60 * 1000, // 15 minutes
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    standardHeaders: true, // Enable the `RateLimit-*` headers
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({ error: 'Too many requests, please try again later.' });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
});

app.use(ratelimit);                 


app.use((req, res, next) => {
    logger.info(`Request: ${req.method} ${req.url}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
});


// api-gateway -> 3000
// identity -> /api/auth/register  -> 3001
// localhost:3000/v1/auth/register  -> localhost:3001/api/auth/register

const proxyOptions = {
    proxyReqPathResolver: function(req) {
        return req.originalUrl.replace('/v1', '/api');
    },
    proxyErrorHandler: function(err, res, next) {
        logger.error(`Proxy error: ${err.message}`);
        res.status(502).json({ 
            success: false,
            message: `Internal server error while processing your request: ${err.message}` 
        });
    }
};


//Setting up the proxy for the identity service
app.use('/v1/auth', proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqBodyDecorator: (proxyReqOpts, srcReq) => {
        
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Proxying request to identity service: ${userReq.method} ${userReq.originalUrl} ${proxyRes.statusCode}`);
        return proxyResData;
    }
}));


app.use(errorrHandler);

app.listen(process.env.PORT, () => {
    logger.info(`API Gateway is running on port ${process.env.PORT}`);
    logger.info(`Identity Service URL: ${process.env.IDENTITY_SERVICE_URL}`);
    logger.info(`Redis URL: ${process.env.REDIS_URL}`);
});