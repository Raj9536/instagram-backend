const Comment = require("../Models/commentModel");
const Post = require("../Models/postModel");
const mongoose = require("mongoose");

// Add a comment to a post
const addComment = async (req, res) => {
    try {
        const { description } = req.body;
        const postId = req.params.postId; // Get postId from the request parameters

        // Validate the postId as a MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).send({
                status: "failure",
                message: "Invalid post ID",
            });
        }

        // Check if description is provided
        if (!description) {
            return res.status(400).send({
                status: "failure",
                message: "Description is required",
            });
        }

        // Create and save the new comment
        const comment = new Comment({
            user: req.user._id,
            post: postId,
            description,
        });

        const savedComment = await comment.save();
        console.log("Comment saved:", savedComment);

        // Update the post by adding the comment ID and populate the user field in comments
        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            { 
                $push: { comments: savedComment._id } 
            },
            { new: true, useFindAndModify: false }
        ).populate({
            path: 'comments',
            populate: {
                path: 'user',
                select: 'username profilePicture', // Include username and profile picture
            }
        });

        if (!updatedPost) {
            return res.status(404).send({
                status: "failure",
                message: "Post not found",
            });
        }

        console.log("Post updated with new comment:", updatedPost);

        res.status(200).send({
            status: "success",
            message: "Comment has been created and post updated",
            post: updatedPost, // return the updated post with populated comments
        });
    } catch (e) {
        console.error("Error adding comment:", e.message);
        res.status(500).send({
            status: "failure",
            message: e.message,
        });
    }
};

// Get comments by post ID
const getbyPostId = async (req, res) => {
    const postId = req.params.postId; // Get postId from the request parameters

    try {
        // Validate the postId as a MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).send({
                status: "failure",
                message: "Invalid post ID",
            });
        }

        const post = await Post.findById(postId).populate({
            path: "comments",
            populate: {
                path: "user",
                select: "username profilePicture", // include username and profile picture
            }
        });

        if (!post) {
            return res.status(404).json({
                status: "failure",
                message: "Post not found",
            });
        }

        res.status(200).json({
            status: "success",
            comments: post.comments,
        });
    } catch (error) {
        console.error("Error fetching comments:", error.message);
        res.status(500).json({
            status: "failure",
            message: error.message,
        });
    }
};

module.exports = { addComment, getbyPostId };
