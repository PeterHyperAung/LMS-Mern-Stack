import mongoose, { set } from "mongoose";

require("dotenv").config();

const dbUrl: string = process.env.DB_URL || "";

export const connectDB = async () => {
  try {
    await mongoose.connect(dbUrl);
    console.log("Database connected successfully");
  } catch (error) {
    console.log("Error connecting to database", error);
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
