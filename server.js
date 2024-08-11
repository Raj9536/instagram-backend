const express = require("express");
const connectDB = require("./database/db");
const cors = require("cors");
const userRoute = require("./Routes/userRoutes");
const postRoute = require("./Routes/postRoutes"); // Import post routes
const commentRoute = require("./Routes/commentRoute"); // Import comment routes
const PORT = 8000;
require('dotenv').config(); // Load environment variables from .env file

const app = express();

connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define routes
app.use("/api/v1/users", userRoute);
app.use("/api/v1/posts", postRoute); // Define routes for posts
app.use("/api/v1/posts", commentRoute); // Define routes for comments under posts

// Handle undefined routes
app.use("*", (req, res) => {
    res.status(404).send(`${req.method} Route ${req.path} not found`);
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
