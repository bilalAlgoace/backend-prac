import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async () => {
  console.log("CONNECTING DATBASE", `process.env.MONGODB_URI}/${DB_NAME}`)
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
  } catch (error) {
    // Ensure it's always a proper Error
    throw error instanceof Error ? error : new Error(JSON.stringify(error));
  }
}

export default connectDB;