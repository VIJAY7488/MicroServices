const express = require('express');
const router = express.Router();
const postController = require('../controller/postController');
const authenticateRequest = require('../middleware/authMiddleware');

//Middleware --> this will tell if the user is an authenticated user or not

router.use(authenticateRequest);

router.post('/create-post', postController.createPost);

module.exports = router;