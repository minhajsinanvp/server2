const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    content: {
        type: {}, // Assuming you intend to store a mixed type for content
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" // Refers to the "User" model

    },
    image: {
        url: String,
        public_id: String
    },
    likes: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
    comments: [{
        text: String,
        created: { type: Date, default: Date.now },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    }] 

}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
