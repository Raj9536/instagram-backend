const express = require("express");
const connectDB = require("./database/db");
const cors = require("cors");
const path = require("path");
const multer = require('multer');
const { verify } = require("./controllers/authController"); 
const userRoute = require("./Routes/userRoutes");
const postRoute = require("./Routes/postRoutes");
const commentRoute = require("./Routes/commentRoute");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Connect to the database
connectDB();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set up Multer storage and file handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
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

// Define routes
app.use("/api/v1/users", userRoute);
app.use("/api/v1/posts", postRoute);
app.use("/api/v1/comments", commentRoute);

app.get('/api/v1/auth/me', verify, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ status: 'failure', message: 'Unauthorized' });
  }
  res.status(200).json({ status: 'success', user: req.user });
});

// Handle undefined routes
app.use("*", (req, res) => {
  res.status(404).send(`${req.method} Route ${req.path} not found`);
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
