import dotenv from "dotenv";
dotenv.config();
import connectDB from "./db/index.js";
import { app } from "./app.js";
import "./types/express/index.js";

connectDB()
.then(() => {
  app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on PORT: ${process.env.PORT}`)
  });
})
.catch((error) => {
  console.log("MongoDB connection failed !!! ", error);
});