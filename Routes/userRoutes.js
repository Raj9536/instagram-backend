const express = require("express");
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");

// Set up Multer storage and file handling
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png/;
        const mimeType = fileTypes.test(file.mimetype);
        const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());

        if (mimeType && extName) {
            return cb(null, true);
        } else {
            cb(new Error('Only .jpeg, .jpg, and .png files are allowed!'));
        }
    }
});

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
router.get("/suggest/random", userController.fetchRandomUsers); // Get random users

// Authentication middleware required for update, follow, and unfollow routes
router.put("/user/:id", upload.single('profilePicture'), userController.updateUser); // Update user by ID with profile picture upload
router.put("/:username/follow", userController.followUnfollowUser); // Follow/unfollow user

module.exports = router;
