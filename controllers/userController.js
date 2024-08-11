const User = require("../Models/User");

//-------------------------SEARCH USERS--------------------------------
const searchUsers = async (req, res) => {
    try {
        const { query } = req.query; // get search query from query parameters
        const users = await User.find({
            username: { $regex: query, $options: "i" } // search by username, case-insensitive
        }).select("-password"); // exclude password from response

        res.status(200).json({
            status: "success",
            data: users
        });
    } catch (error) {
        res.status(500).json({
            status: "failure",
            message: error.message
        });
    }
};

//-------------------------GET USER BY USERNAME-----------------------
const getUserByUsername = async (req, res) => {
    try {
        const { username } = req.params; // get username from URL parameters
        const user = await User.findOne({ username: username }).select("-password");

        if (!user) {
            return res.status(404).json({
                status: "failure",
                message: "User not found"
            });
        }

        res.status(200).json({
            status: "success",
            data: user
        });
    } catch (error) {
        res.status(500).json({
            status: "failure",
            message: error.message
        });
    }
};

//-------------------------GET USER BY ID-------------------------------------
const getUser = async (req, res) => {
    try {
        const { id } = req.params; // get user ID from URL parameters
        const user = await User.findById(id).select("-password");

        if (!user) {
            return res.status(404).json({
                status: "failure",
                message: "User not found"
            });
        }

        res.status(200).json({
            status: "success",
            data: user
        });
    } catch (error) {
        res.status(500).json({
            status: "failure",
            message: error.message
        });
    }
};

//-------------------------GET FOLLOWINGS------------------------------
const getFollowings = async (req, res) => {
    try {
        const { username } = req.params; // get username from URL parameters
        const user = await User.findOne({ username: username });

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
        res.status(500).json({
            status: "failure",
            message: error.message
        });
    }
};

//-------------------------GET FOLLOWERS------------------------------
const getFollowers = async (req, res) => {
    try {
        const { username } = req.params; // get username from URL parameters
        const user = await User.findOne({ username: username });

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
        res.status(500).json({
            status: "failure",
            message: error.message
        });
    }
};

//-------------------------UPDATE USER----------------------------------
const updateUser = async (req, res) => {
    try {
        const { id } = req.params; // get user ID from URL parameters
        const updatedData = req.body; // get updated data from request body
        const user = await User.findByIdAndUpdate(id, updatedData, {
            new: true, // return the updated document
            runValidators: true // validate the data before updating
        }).select("-password");

        if (!user) {
            return res.status(404).json({
                status: "failure",
                message: "User not found"
            });
        }

        res.status(200).json({
            status: "success",
            data: user
        });
    } catch (error) {
        res.status(500).json({
            status: "failure",
            message: error.message
        });
    }
};

//-------------------------FOLLOW USER----------------------------------
const followUser = async (req, res) => {
    try {
        const { username } = req.params; // get username from URL parameters
        const { id } = req.user; // get user ID from the token

        const userToFollow = await User.findOne({ username: username });
        if (!userToFollow) {
            return res.status(404).json({
                status: "failure",
                message: "User to follow not found"
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                status: "failure",
                message: "User not found"
            });
        }

        if (user.followings.includes(userToFollow._id)) {
            return res.status(400).json({
                status: "failure",
                message: "You are already following this user"
            });
        }

        user.followings.push(userToFollow._id);
        userToFollow.followers.push(user._id);
        await user.save();
        await userToFollow.save();

        res.status(200).json({
            status: "success",
            message: "User followed successfully"
        });
    } catch (error) {
        res.status(500).json({
            status: "failure",
            message: error.message
        });
    }
};

//-------------------------UNFOLLOW USER--------------------------------
const unfollowUser = async (req, res) => {
    try {
        const { username } = req.params; // get username from URL parameters
        const { id } = req.user; // get user ID from the token

        const userToUnfollow = await User.findOne({ username: username });
        if (!userToUnfollow) {
            return res.status(404).json({
                status: "failure",
                message: "User to unfollow not found"
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                status: "failure",
                message: "User not found"
            });
        }

        if (!user.followings.includes(userToUnfollow._id)) {
            return res.status(400).json({
                status: "failure",
                message: "You are not following this user"
            });
        }

        user.followings.pull(userToUnfollow._id);
        userToUnfollow.followers.pull(user._id);
        await user.save();
        await userToUnfollow.save();

        res.status(200).json({
            status: "success",
            message: "User unfollowed successfully"
        });
    } catch (error) {
        res.status(500).json({
            status: "failure",
            message: error.message
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
    followUser,
    unfollowUser
};
