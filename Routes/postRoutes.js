const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const authController = require("../controllers/authController");

// Public routes
router.post("/", authController.verify, postController.createPost); // Create a new post
router.get("/:id", postController.getPost); // Get a single post by ID
router.get("/user/:username", postController.getPostsUser); // Get posts by a specific user
router.get("/timeline", authController.verify, postController.getTimeline); // Get timeline for authenticated user

// Authentication middleware required for update and delete routes
router.put("/:id", authController.verify, postController.updatePost); // Update a post by ID
router.delete("/:id", authController.verify, postController.deletePost); // Delete a post by ID
router.put("/:id/like", authController.verify, postController.likeUnlike); // Like/Unlike a post

module.exports = router;
