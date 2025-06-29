const generateToken = require('../utils/genrateToken');
const logger = require('../utils/logger');
const { validateUserRegistration, validateUserLogin } = require('../utils/validation');
const User = require('../models/User');

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
        const { email, password } = req.body;

        // Validate the Schema
        const { errorr } = validateUserLogin(req.body);
        if (errorr) {
            logger.error(`Validation Error: ${errorr.details[0].message}`);
            return res.status(400).json({ success: false, message: errorr.details[0].message });    
        }

        // Check if user exists
        const user = await User.find({ email });
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



module.exports = {
    registerUser,
    loginUser
};