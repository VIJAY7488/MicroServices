const Post = require('../models/Post');
const logger = require('../utils/logger');


const createPost = async(req, res) => {
    logger.info('create post endpoint hit');
    try {
        const { content, media, visibility, tags, location } = req.body;
        const newPost = new Post({
            userId: req.user.userId,
            content,
            media: media || [],
            visibility,
            tags: tags || [],
            location
        });

        await newPost.save();
        logger.info('Post created successfully:', newPost);
        res.status(201).json({ success: true, message: 'Post created successfully', post: newPost });
    } catch (error) {
        logger.error('Error creating post:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' }); 
    }
};





module.exports = {
    createPost,
    getAllPosts,
    getSinglePost,
    updatePost,
    deletePost
};