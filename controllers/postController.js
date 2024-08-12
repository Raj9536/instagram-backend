const Post = require("../Models/postModel");
const User = require("../Models/User");
const Comment = require("../Models/commentModel");

//-------------------------CREATE POST---------------------------------------
const createPost = async (req, res) => {
    req.body.user = req.user._id; // Associate the post with the current user
    const newPost = new Post({
        user: req.body.user,
        description: req.body.description, // Use 'description' to match your schema
        imgurl: req.body.imgurl, // Use 'imgurl' to match your schema
    });
    try {
        await newPost.save();
        res.status(200).send({
            status: "success",
            message: "Post has been created",
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

//-------------------------GET TIMELINE---------------------------------------
const getTimeline = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) - 1 || 0;
        const limit = parseInt(req.query.limit) || 10;
        const user = await User.findById(userId).select("followings");
        const myPosts = await Post.find({ user: userId })
            .skip(page * limit)
            .limit(limit)
            .sort({ createdAt: "desc" })
            .populate("user", "username profilePicture");
        
        const followingsPosts = await Promise.all(
            user.followings.map((followingId) => {
                return Post.find({
                    user: followingId,
                    createdAt: { $gte: new Date(new Date().getTime() - 86400000) }
                })
                    .skip(page * limit)
                    .limit(limit)
                    .sort({ createdAt: "desc" })
                    .populate("user", "username profilePicture");
            })
        );

        const allPosts = myPosts.concat(...followingsPosts);
        res.status(200).send({
            status: "success",
            posts: allPosts,
            limit: allPosts.length,
        });
    } catch (e) {
        res.status(500).send({
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
        res.status(200).json(posts);
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
        const post = await Post.findById(req.params.id).populate("user");
        if (!post) {
            return res.status(404).send({
                status: "failure",
                message: "Post not found",
            });
        }
        res.status(200).json(post);
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
};
