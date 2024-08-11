const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables from .env file

const URL = process.env.MONGO_URL; // Get the URL from the .env file

const connectDB = async () => {
  try {
    const con = await mongoose.connect(URL);
    console.log("DB Connected Successfully ✅");
  } catch (e) {
    console.log(`Authentication to database failed ❗`);
    process.exit(1);
  }
};

module.exports = connectDB;
