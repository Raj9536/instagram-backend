const bcrypt = require("bcrypt");
const User = require("../Models/User");
const jwt = require("jsonwebtoken");
const generateToken = require("../utils/generateToken");

//-------------------------SIGNUP---------------------------------------
const signup = async (req, res) => {
    try {
        const { username, password, email } = req.body;

        // Check if the username already exists
        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            return res.status(400).json({
                status: "failure",
                message: "Username already exists"
            });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user
        const newUser = new User({
            username: username,
            password: hashedPassword,
            email: email
        });

        // Save the user to the database
        const savedUser = await newUser.save();

        // Respond with success
        res.status(201).json({
            status: "success",
            message: "User created successfully",
            data: {
                id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email
            }
        });
    } catch (error) {
        // Handle errors
        res.status(500).json({
            status: "failure",
            message: error.message,
        });
    }
};

//-------------------------LOGIN---------------------------------------
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find the user by username
        const user = await User.findOne({ username: username });
        if (!user) {
            return res.status(401).json({
                status: "failure",
                message: "User not found"
            });
        }

        // Check if the password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                status: "failure",
                message: "Invalid password"
            });
        }

        // Generate access token
        const accessToken = generateToken.generateAccessToken(user);

        // Respond with success and tokens
        res.status(200).json({
            status: "success",
            message: "Logged in successfully",
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                accessToken: accessToken
            }
        });
    } catch (error) {
        // Handle errors
        res.status(500).json({
            status: "failure",
            message: error.message,
        });
    }
};

//-------------------------LOGOUT---------------------------------------
const logout = async (req, res) => {
    try {
        const { username } = req.body;

        // Find the user by username and remove the refresh token
        const user = await User.findOneAndUpdate(
            { username: username },
            { $unset: { jwtToken: "" } },
            { new: true }
        );

        if (!user) {
            return res.status(401).json({
                status: "failure",
                message: "User not found or no refresh token to remove"
            });
        }

        // Respond with success
        res.status(200).json({
            status: "success",
            message: "Logged out successfully"
        });
    } catch (error) {
        // Handle errors
        res.status(500).json({
            status: "failure",
            message: error.message,
        });
    }
};

//-------------------------VERIFY---------------------------------------
const verify = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(403).json({
            status: "failure",
            message: "Authorization header missing"
        });
    }

    const token = authHeader.split(" ")[1]; // Bearer <token>

    if (!token) {
        return res.status(403).json({
            status: "failure",
            message: "Token missing"
        });
    }

    try {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                throw new Error("Token is not valid");
            }
            req.user = user;
            next();
        });
    } catch (e) {
        res.status(500).json({
            status: "failure",
            message: e.message,
        });
    }
};

// Export functions
module.exports = {
    signup,
    login,
    logout,
    verify
};
