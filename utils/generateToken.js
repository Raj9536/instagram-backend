const jwt = require("jsonwebtoken");

// Generate access token
const generateAccessToken = (user) => {
  return jwt.sign(
    { username: user.username, role: user.role, _id: user._id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1d" }
  );
};

// Generate refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { username: user.username, role: user.role, _id: user._id },
    process.env.REFRESH_TOKEN_SECRET
  );
};

module.exports = { generateAccessToken, generateRefreshToken };
