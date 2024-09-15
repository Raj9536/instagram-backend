const User = require('../Models/User');
const fs = require('fs');
const path = require('path');

//-------------------------SEARCH USERS--------------------------------
const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;

        let users;
        if (query === '*') {
            users = await User.find({}).select("-password");
        } else {
            users = await User.find({
                username: { $regex: query, $options: "i" }
            }).select("-password");
        }

        res.status(200).json({
            status: "success",
            data: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            status: "failure",
            message: "Internal Server Error"
        });
    }
};

//-------------------------GET USER BY USERNAME-----------------------
const getUserByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username }).select("-password");

        if (!user) {
            return res.status(404).json({
                status: "failure",
                message: "User not found"
            });
        }

        // Prepend the base URL to the profilePicture path if it exists
        if (user.profilePicture) {
            user.profilePicture = `http://localhost:8000/${user.profilePicture}`;
        }

        res.status(200).json({
            status: "success",
            data: user
        });
    } catch (error) {
        console.error('Error fetching user by username:', error);
        res.status(500).json({
            status: "failure",
            message: "Internal Server Error"
        });
    }
};

//-------------------------GET USER BY ID-------------------------------------
const getUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select("-password");

        if (!user) {
            return res.status(404).json({
                status: "failure",
                message: "User not found"
            });
        }

        // Prepend the base URL to the profilePicture path if it exists
        if (user.profilePicture) {
            user.profilePicture = `http://localhost:8000/${user.profilePicture}`;
        }

        res.status(200).json({
            status: "success",
            data: user
        });
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json({
            status: "failure",
            message: "Internal Server Error"
        });
    }
};

//-------------------------GET FOLLOWINGS------------------------------
const getFollowings = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({
                status: "failure",
                message: "User not found"
            });
        }

        const followings = await User.find({
            _id: { $in: user.followings }
        }).select("-password");

        res.status(200).json({
            status: "success",
            data: followings
        });
    } catch (error) {
        console.error('Error fetching followings:', error);
        res.status(500).json({
            status: "failure",
            message: "Internal Server Error"
        });
    }
};

//-------------------------GET FOLLOWERS------------------------------
const getFollowers = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({
                status: "failure",
                message: "User not found"
            });
        }

        const followers = await User.find({
            _id: { $in: user.followers }
        }).select("-password");

        res.status(200).json({
            status: "success",
            data: followers
        });
    } catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({
            status: "failure",
            message: "Internal Server Error"
        });
    }
};

//------------------------------GET NUMBER OF POSTS-----------------------------
const getPostsCount = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({
                status: "failure",
                message: "User not found"
            });
        }

        const postsCount = user.posts.length;
        res.status(200).json({
            status: "success",
            data: { postsCount }
        });
    } catch (error) {
        console.error('Error fetching posts count:', error);
        res.status(500).json({
            status: "failure",
            message: "Internal Server Error"
        });
    }
};

//-------------------------UPDATE USER----------------------------------
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        // Handle profile picture upload
        if (req.file) {
            const filePath = `uploads/${req.file.filename}`;
            updatedData.profilePicture = filePath;

            const user = await User.findById(id);
            if (user && user.profilePicture && user.profilePicture !== 'YOUR_DEFAULT_AVATAR_URL') {
                fs.unlink(path.join(__dirname, '..', user.profilePicture), (err) => {
                    if (err) {
                        console.error('Error deleting old profile picture:', err);
                    }
                });
            }
        }

        // Update user and ensure the username is part of the response
        const user = await User.findByIdAndUpdate(id, updatedData, {
            new: true,
            runValidators: true,
        }).select("-password");

        if (!user) {
            return res.status(404).json({
                status: "failure",
                message: "User not found"
            });
        }

        // Prepend the base URL to the profilePicture path if it exists
        if (user.profilePicture) {
            user.profilePicture = `http://localhost:8000/${user.profilePicture}`;
        }

        res.status(200).json({
            status: "success",
            data: user
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            status: "failure",
            message: "Internal Server Error"
        });
    }
};

//-------------------------FOLLOW/UNFOLLOW USER----------------------------------
const followUnfollowUser = async (req, res) => {
    try {
        // Extract current user's ID from the request body
        const currentUserId = req.body.userId;
        if (!currentUserId) {
            return res.status(400).json({ status: "failure", message: "Current user ID is missing in the request body" });
        }

        // Find the user to follow/unfollow by their username
        const userToFollowOrUnfollow = await User.findOne({ username: req.params.username });
        if (!userToFollowOrUnfollow) {
            return res.status(404).json({ status: "failure", message: "User not found" });
        }

        // Find the current user by their ID
        const currentUser = await User.findById(currentUserId);
        if (!currentUser) {
            return res.status(404).json({ status: "failure", message: "Current user not found" });
        }

        // Prevent users from following themselves
        if (currentUser._id.equals(userToFollowOrUnfollow._id)) {
            return res.status(400).json({ status: "failure", message: "You cannot follow yourself" });
        }

        // Check if the current user is already following the target user
        if (!currentUser.followings.includes(userToFollowOrUnfollow._id)) {
            // Follow the user
            await currentUser.updateOne({ $push: { followings: userToFollowOrUnfollow._id } });
            await userToFollowOrUnfollow.updateOne({ $push: { followers: currentUser._id } });

            return res.status(200).json({
                status: "success",
                message: `You have followed ${userToFollowOrUnfollow.username}`,
            });
        } else {
            // Unfollow the user
            await currentUser.updateOne({ $pull: { followings: userToFollowOrUnfollow._id } });
            await userToFollowOrUnfollow.updateOne({ $pull: { followers: currentUser._id } });

            return res.status(200).json({
                status: "success",
                message: `You have unfollowed ${userToFollowOrUnfollow.username}`,
            });
        }
    } catch (error) {
        return res.status(500).json({
            status: "failure",
            message: error.message,
        });
    }
};


//-------------------------FETCH RANDOM USERS--------------------------------
const fetchRandomUsers = async (req, res) => {
    try {
        const users = await User.aggregate([{ $sample: { size: 5 } }]);
        if (users.length === 0) {
            return res.status(404).json({
                status: "failure",
                message: "No users found"
            });
        }
        res.status(200).json({
            status: "success",
            data: users
        });
    } catch (error) {
        console.error('Error fetching random users:', error);
        res.status(500).json({
            status: "failure",
            message: "Internal Server Error"
        });
    }
};

module.exports = {
    searchUsers,
    getUserByUsername,
    getUser,
    getFollowings,
    getFollowers,
    updateUser,
    followUnfollowUser,
    getPostsCount,
    fetchRandomUsers
};
