const User = require('../Models/User'); // Ensure you have the User model imported

//-------------------------SEARCH USERS--------------------------------
const searchUsers = async (req, res) => {
    try {
        const { query } = req.query; // Get search query from query parameters

        let users;
        if (query === '*') {
            // Return all users if query is '*'
            users = await User.find({}).select("-password");
        } else {
            users = await User.find({
                username: { $regex: query, $options: "i" } // Search by username, case-insensitive
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
        const { username } = req.params; // Get username from URL parameters
        const user = await User.findOne({ username }).select("-password");

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
        const { id } = req.params; // Get user ID from URL parameters
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
        const { username } = req.params; // Get username from URL parameters
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({
                status: "failure",
                message: "User not found"
            });
        }

        const followings = await User.find({
            _id: { $in: user.followings } // Ensure field name matches your schema
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
        const { username } = req.params; // Get username from URL parameters
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({
                status: "failure",
                message: "User not found"
            });
        }

        const followers = await User.find({
            _id: { $in: user.followers } // Ensure field name matches your schema
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
        const { username } = req.params; // Get username from URL parameters
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({
                status: "failure",
                message: "User not found"
            });
        }
        // The number of posts is the length of the 'posts' array
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
        const { id } = req.params; // Get user ID from URL parameters
        const updatedData = req.body; // Get updated data from request body

        const user = await User.findByIdAndUpdate(id, updatedData, {
            new: true, // Return the updated document
            runValidators: true // Validate the data before updating
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
        const currentUser = await User.findById(req.user._id); // Ensure currentUser is fetched by ID
        if (!currentUser) {
            return res.status(404).json({ status: "failure", message: "Current user not found" });
        }

        const userToFollowOrUnfollow = await User.findOne({ username: req.params.username });
        if (!userToFollowOrUnfollow) {
            return res.status(404).json({ status: "failure", message: "User to follow/unfollow not found" });
        }

        // Initialize arrays if they are undefined
        if (!currentUser.followings) {
            currentUser.followings = [];
        }
        if (!userToFollowOrUnfollow.followers) {
            userToFollowOrUnfollow.followers = [];
        }

        // Check if the user is already followed or not
        if (!currentUser.followings.includes(userToFollowOrUnfollow._id)) {
            // Follow the user
            await currentUser.updateOne({ $push: { followings: userToFollowOrUnfollow._id } });
            await userToFollowOrUnfollow.updateOne({ $push: { followers: currentUser._id } });

            res.status(200).json({
                status: "success",
                message: `You have followed ${userToFollowOrUnfollow.username}`,
            });
        } else {
            // Unfollow the user
            await currentUser.updateOne({ $pull: { followings: userToFollowOrUnfollow._id } });
            await userToFollowOrUnfollow.updateOne({ $pull: { followers: currentUser._id } });

            res.status(200).json({
                status: "success",
                message: `You have unfollowed ${userToFollowOrUnfollow.username}`,
            });
        }
    } catch (error) {
        console.error('Error following/unfollowing user:', error);
        res.status(500).json({ status: "failure", message: "Internal Server Error" });
    }
};
//-------------------------FETCH RANDOM USERS--------------------------------
const fetchRandomUsers = async (req, res) => {
    try {
        const users = await User.aggregate([{ $sample: { size: 5 } }]); // Fetch up to 5 random users
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
    fetchRandomUsers // Ensure getPostsCount is exported correctly
};
