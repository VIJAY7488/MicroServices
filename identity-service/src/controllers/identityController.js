const generateToken = require('../utils/genrateToken');
const logger = require('../utils/logger');
const { validateUserRegistration, validateUserLogin } = require('../utils/validation');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { log } = require('winston');

// User Register 
const registerUser = async (req, res) => {
    logger.info('Registeration endpoint hit');
    try {
        //Validate the Schema
        const {error} = validateUserRegistration(req.body);
        if(error){
            logger.error(`Validation Error: ${error.details[0].message}`);
            return res.status(400).json({ success: false, message: error.details[0].message });
        };

        const { username, email, password } = req.body;
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            logger.error('User already exists');
            return res.status(400).json({ success: false, message: 'User already exists' });
        };

        // Create new user
        const newUser = new User({ username, email, password });
        await newUser.save();
        logger.info('User registered successfully');

        const { accessToken, refreshToken } = await generateToken(newUser);

        return res.status(201).json({ 
            success: true, 
            message: 'User registered successfully',
            accessToken,
            refreshToken
        });
    } catch (error) {
        logger.error(`Error in registerUser: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });      
    }
};

// User Login
const loginUser = async (req, res) => {
    logger.info('Login endpoint hit');

    try {
        // Validate the Schema
        const { errorr } = validateUserLogin(req.body);
        if (errorr) {
            logger.error(`Validation Error: ${errorr.details[0].message}`);
            return res.status(400).json({ success: false, message: errorr.details[0].message });    
        }

        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            logger.error('User not found');
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            logger.error('Invalid password or email');
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        // Generate tokens
        const { accessToken, refreshToken } = await generateToken(user);

        logger.info('User logged in successfully');
        return res.status(200).json({ 
            success: true, 
            message: 'User logged in successfully',
            accessToken,
            refreshToken,
            userId: user._id,
        });
    } catch (error) {
        logger.error(`Error in loginUser: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Internal Server Error' }); 
    }
};


// Refresh Token
const refreshTokenUser = async(req, res) => {
    logger.info('Refresh token endpoint hit');

    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger.error('Refresh token missing');
            return res.status(400).json({ success: false, message: 'Refresh token missing' });
        }

        const storedToken = await RefreshToken.findOne({ token: refreshToken });

        if (!storedToken || storedToken.expiredAt < Date.now()) {
            logger.error('Invalid or expired refresh token');
            return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
        }

        const user = await User.findById(storedToken.user);

        if(!user) {
            logger.error('User not found');
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateToken(user);

        // Delete the old refresh token
        await RefreshToken.deleteOne({ _id: storedToken._id });

        res.status(200).json({ 
            success: true, 
            message: 'Tokens refreshed successfully',
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        logger.error(`Error in refreshToken: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// User Logout

const logoutUser = async (req, res) => {
    logger.info('Logout endpoint hit');
    try {

        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger.error('Refresh token missing');
            return res.status(400).json({ success: false, message: 'Refresh token missing' });
        }

        await RefreshToken.deleteOne({ token: refreshToken });
        logger.info('Refresh token deleted successfully for logout');
        
        return res.status(200).json({ success: true, message: 'User logged out successfully' });
    } catch (error) {
        logger.error(`Error in userLogout: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};



module.exports = {
    registerUser,
    loginUser,
    refreshTokenUser,
    logoutUser
};