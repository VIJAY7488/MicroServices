const express = require('express');
const identityRouter = express.Router();
const identityController = require('../controllers/identityController');

identityRouter.post('/register', identityController.registerUser);
identityRouter.post('/login', identityController.loginUser);
identityRouter.post('/refresh-token', identityController.refreshTokenUser);
identityRouter.post('/logout', identityController.logoutUser); 

module.exports = identityRouter;