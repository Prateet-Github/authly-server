import mongoose from "mongoose";
import env from "./env.js";

mongoose.set("strictQuery", true);

if(env.NODE_ENV === "development") {
  mongoose.set("debug", true);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;