const Comment = require("../Models/commentModel");
const Post = require("../Models/postModel");

// Add a comment to a post
const addComment = async (req, res) => {
    try {
      const { post, description } = req.body; // Extract post and description from request body
  
      if (!post || !description) {
        return res.status(400).send({
          status: "failure",
          message: "Post ID and description are required",
        });
      }
  
      const comment = new Comment({
        user: req.user._id,
        post, // Associate the comment with a post
        description, // Comment text
      });
  
      const savedComment = await comment.save();
      await Post.findByIdAndUpdate(
        post,
        { $push: { comments: savedComment._id } }
      );
  
      res.status(200).send({
        status: "success",
        message: "Comment has been created",
      });
    } catch (e) {
      res.status(500).send({
        status: "failure",
        message: e.message,
      });
    }
  };
  

// Get comments by post ID
const getbyPostId = async (req, res) => {
  const postId = req.params.postId;

  try {
    const post = await Post.findById(postId).populate("comments");
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
    res.status(500).json({
      status: "failure",
      message: error.message,
    });
  }
};

module.exports = { addComment, getbyPostId };
