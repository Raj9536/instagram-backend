const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const authController = require("../controllers/authController");
const multer = require('multer');
const path = require('path');

// Set up Multer storage and file handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
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

// Public routes
router.post("/", authController.verify, upload.single('imgurl'), postController.createPost); // Create a new post

// Authentication required routes
router.get("/random", authController.verify, postController.getRandomPosts); // Get random posts
router.get("/timeline", authController.verify, postController.getTimeline); // Get timeline for authenticated user
router.put("/:id/like", authController.verify, postController.likeUnlike); // Like/Unlike a post
router.put("/:id", authController.verify, postController.updatePost); // Update a post by ID
router.delete("/:id", authController.verify, postController.deletePost); // Delete a post by ID

// Public routes (placed after specific routes)
router.get("/user/:username", postController.getPostsUser); // Get posts by a specific user
router.get("/:id", postController.getPost); // Get a single post by ID

module.exports = router;
