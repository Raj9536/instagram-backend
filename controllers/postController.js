const mongoose = require("mongoose");
const Post = require("../Models/postModel");
const User = require("../Models/User");
const Comment = require("../Models/commentModel");

//-------------------------CREATE POST---------------------------------------
const createPost = async (req, res) => {
    const imgurl = req.file ? `/uploads/${req.file.filename}` : null;

    const newPost = new Post({
        user: req.user._id,
        description: req.body.description,
        imgurl: imgurl,
    });

    try {
        const savedPost = await newPost.save();

        await User.findByIdAndUpdate(
            req.user._id,
            { $push: { posts: savedPost._id } },
            { new: true }
        );

        res.status(200).send({
            status: "success",
            message: "Post has been created and added to user profile",
            data: {
                ...savedPost._doc,
                imgurl: savedPost.imgurl ? `http://localhost:8000${savedPost.imgurl}` : null,
            },
        });
    } catch (e) {
        res.status(500).send({
            status: "failure",
            message: e.message,
        });
    }
};

//-------------------------UPDATE POST---------------------------------------
const updatePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (req.user._id.equals(post.user)) {
            await Post.updateOne({ _id: req.params.id }, { $set: req.body });
            res.status(200).send({
                status: "success",
                message: "Post has been updated",
            });
        } else {
            res.status(401).send({
                status: "failure",
                message: "You are not authorized",
            });
        }
    } catch (e) {
        res.status(500).send({
            status: "failure",
            message: e.message,
        });
    }
};

//-------------------------DELETE POST---------------------------------------
const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (req.user._id.equals(post.user) || req.user.role === "admin") {
            await Comment.deleteMany({ post: req.params.id });
            await Post.findByIdAndDelete(req.params.id);
            res.status(200).send({
                status: "success",
                message: "Post has been deleted",
            });
        } else {
            res.status(401).send({
                status: "failure",
                message: "You are not authorized",
            });
        }
    } catch (e) {
        res.status(500).send({
            status: "failure",
            message: e.message,
        });
    }
};

//-------------------------GET RANDOM POSTS------------------------------------
const getRandomPosts = async (req, res) => {
    try {
        let fetchedPostIds = req.query.fetchedPostIds || [];
        if (typeof fetchedPostIds === 'string') {
            fetchedPostIds = fetchedPostIds.split(',');
        }

        fetchedPostIds = fetchedPostIds
            .filter(id => mongoose.Types.ObjectId.isValid(id))
            .map(id => mongoose.Types.ObjectId(id));

        const query = { _id: { $nin: fetchedPostIds } };

        const randomPosts = await Post.aggregate([
            { $match: query },
            { $sample: { size: 1000 } }, // Fetch up to 1000 posts randomly, increase as needed
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'post',
                    as: 'comments'
                }
            },
            {
                $project: {
                    'user.password': 0,
                    'comments.__v': 0,
                    '__v': 0
                }
            }
        ]);

        if (!randomPosts.length) {
            return res.status(404).json({
                status: 'failure',
                message: 'No posts found'
            });
        }

        const randomPostsWithFullImgUrl = randomPosts.map(post => ({
            ...post,
            imgurl: post.imgurl ? `http://localhost:8000${post.imgurl}` : null,
            user: {
                ...post.user,
                profilePicture: post.user.profilePicture ? `http://localhost:8000${post.user.profilePicture}` : null,
            }
        }));

        res.status(200).json({
            status: 'success',
            posts: randomPostsWithFullImgUrl,
        });
    } catch (e) {
        console.error('Error fetching random posts:', e.message);
        res.status(500).json({
            status: 'failure',
            message: 'Internal Server Error',
        });
    }
};

//-------------------------GET TIMELINE---------------------------------------
const getTimeline = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) - 1 || 0;
        const limit = parseInt(req.query.limit) || 10;

        // Get the user's own posts
        const myPosts = await Post.find({ user: userId })
            .skip(page * limit)
            .limit(limit)
            .sort({ createdAt: "desc" })
            .populate("user", "username profilePicture");

        // Get the posts from the users the current user is following
        const user = await User.findById(userId).select("followings");
        const followingsPosts = await Post.find({
            user: { $in: user.followings },
        })
            .skip(page * limit)
            .limit(limit)
            .sort({ createdAt: "desc" })
            .populate("user", "username profilePicture");

        // Combine the user's own posts with the posts from the users they follow
        const allPosts = [...myPosts, ...followingsPosts];

        // Map the posts to include full URLs for images and profile pictures
        const postsWithFullImgUrl = allPosts.map((post) => ({
            ...post._doc,
            imgurl: post.imgurl ? `http://localhost:8000${post.imgurl}` : null,
            user: {
                ...post.user._doc,
                profilePicture: post.user.profilePicture
                    ? `http://localhost:8000${post.user.profilePicture}`
                    : null,
            },
        }));

        res.status(200).json({
            status: "success",
            posts: postsWithFullImgUrl,
            limit: postsWithFullImgUrl.length,
        });
    } catch (e) {
        res.status(500).json({
            status: "failure",
            message: e.message,
        });
    }
};

//-------------------------GET USER POSTS------------------------------------
const getPostsUser = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).send({
                status: "failure",
                message: "User not found",
            });
        }
        const posts = await Post.find({ user: user._id });

        const postsWithFullImgUrl = posts.map(post => ({
            ...post._doc,
            imgurl: post.imgurl ? `http://localhost:8000${post.imgurl}` : null
        }));

        res.status(200).json(postsWithFullImgUrl);
    } catch (e) {
        res.status(500).send({
            status: "failure",
            message: e.message,
        });
    }
};

//-------------------------GET SINGLE POST------------------------------------
const getPost = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ status: 'failure', message: 'Invalid post ID' });
        }

        const post = await Post.findById(req.params.id).populate("user");
        if (!post) {
            return res.status(404).send({
                status: "failure",
                message: "Post not found",
            });
        }

        const postWithFullImgUrl = {
            ...post._doc,
            imgurl: post.imgurl ? `http://localhost:8000${post.imgurl}` : null,
            user: {
                ...post.user._doc,
                profilePicture: post.user.profilePicture ? `http://localhost:8000${post.user.profilePicture}` : null,
            }
        };

        res.status(200).json(postWithFullImgUrl);
    } catch (e) {
        res.status(500).send({
            status: "failure",
            message: e.message,
        });
    }
};

//-------------------------LIKE/UNLIKE POST------------------------------------
const likeUnlike = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ status: 'failure', message: 'Invalid post ID' });
        }

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).send({
                status: "failure",
                message: "Post not found",
            });
        }

        if (!post.likes.includes(req.user._id)) {
            await post.updateOne({ $push: { likes: req.user._id } });
            res.status(200).send({
                status: "success",
                message: "Post has been liked",
            });
        } else {
            await post.updateOne({ $pull: { likes: req.user._id } });
            res.status(200).send({
                status: "success",
                message: "Post has been unliked",
            });
        }
    } catch (e) {
        res.status(500).send({
            status: "failure",
            message: e.message,
        });
    }
};

module.exports = {
    createPost,
    updatePost,
    deletePost,
    getTimeline,
    getPostsUser,
    getPost,
    likeUnlike,
    getRandomPosts,
};
