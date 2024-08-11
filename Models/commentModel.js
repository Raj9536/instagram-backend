const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    post: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Post", 
      required: true 
    },
    description: { 
      type: String, 
      required: true, 
      max: 500 
    },
  },
  { timestamps: true } // This will automatically add createdAt and updatedAt fields
);

module.exports = mongoose.model("Comment", CommentSchema);
