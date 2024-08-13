const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");

// Authentication routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

// User routes
router.get("/search", userController.searchUsers); // Search users by query
router.get("/:username", userController.getUserByUsername); // Get user by username
router.get("/user/:id", userController.getUser); // Get user by ID
router.get("/:username/followings", userController.getFollowings); // Get followings
router.get("/:username/followers", userController.getFollowers); // Get followers
router.get("/:username/posts", userController.getPostsCount); // Get number of posts

// Authentication middleware required for update, follow, and unfollow routes
router.put("/user/:id", userController.updateUser); // Update user by ID
router.put("/:username/follow", userController.followUnfollowUser); // Follow/unfollow user

module.exports = router;
