const generateToken = require('../utils/genrateToken');
const logger = require('../utils/logger');
const { validateUserRegistration } = require('../utils/validation');

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
}



module.exports = {
    registerUser,
};