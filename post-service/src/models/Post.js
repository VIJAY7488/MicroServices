const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    media: [{
        url: String,
        type: {
            type: String,
            enum: ['image', 'video']
        }
    }],
    likes: [
        { type: mongoose.Schema.ObjectId, ref: 'User' }
    ],
    comments:[{
        userId: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        comment: { type: String},
        createdAt: {
            type: Date,
            default: Date.now
        }
        
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    visibility: {
        type: String,
        enum: ['public', 'private', 'friends'],
        default: 'public'
    },
    tags: [{ type: String}],
    location: {
        latitude: Number,
        longitude: Number
    }
}, {timestamps: true});

postSchema.index({content: 'text'});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;