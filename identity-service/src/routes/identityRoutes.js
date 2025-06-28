const express = require('express');
const identityRouter = express.Router();
const identityController = require('../controllers/identityController');

identityController.post('/register', identityController.registerUser);

module.exports = identityRouter;