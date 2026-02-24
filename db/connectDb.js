require("dotenv").config();

const mongoose = require("mongoose");

const mongoDb = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");
};

module.exports = mongoDb;
