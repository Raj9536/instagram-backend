const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const authController = require("../controllers/authController");

// Route to add a comment to a post
router.post("/:postId/comments", authController.verify, commentController.addComment);

// Route to get all comments for a specific post
router.get("/:postId/comments", commentController.getbyPostId);

module.exports = router;
