const express = require("express");
const connectDB = require("./database/db");
const cors = require("cors");
const { verify } = require("./controllers/authController"); 
const userRoute = require("./Routes/userRoutes");
const postRoute = require("./Routes/postRoutes");
const commentRoute = require("./Routes/commentRoute");
const PORT = 8000;
require('dotenv').config(); 
const app = express();

connectDB();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Implement `verify` 
app.use((req, res, next) => {
    if (req.path === "/api/v1/users/login" || req.path === "/api/v1/users/signup") {
        return next(); 
    }
    verify(req, res, next); 
});

// Define routes
app.use("/api/v1/users", userRoute);
app.use("/api/v1/posts", postRoute);
app.use("/api/v1/comments", commentRoute);

// Handle undefined routes
app.use("*", (req, res) => {
    res.status(404).send(`${req.method} Route ${req.path} not found`);
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
