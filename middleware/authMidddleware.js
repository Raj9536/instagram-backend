const jwt = require('jsonwebtoken');
const User = require('../Models/User');

const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from 'Bearer <token>'
    if (!token) {
        return res.status(401).json({ status: 'failure', message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify JWT
        const user = await User.findById(decoded.id); // Find the user by decoded ID
        if (!user) {
            return res.status(401).json({ status: 'failure', message: 'Unauthorized' });
        }
        req.user = user; // Attach the user to req object
        next(); // Proceed to next middleware
    } catch (error) {
        return res.status(401).json({ status: 'failure', message: 'Unauthorized' });
    }
};

module.exports = authenticate;
