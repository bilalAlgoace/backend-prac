import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { DB_NAME } from "./constants.js";
dotenv.config();


console.log("server", process.env.PORT, `${process.env.MONGODB_URI}/${DB_NAME}`)
console.log(app)
connectDB()
.then(() => {
  app.listen(5000, () => {
    console.log(`Server running on PORT: ${process.env.PORT}`)
  });
})
.catch((error) => {
  // console.error("Startup Error:", error instanceof Error ? error.stack : JSON.stringify(error, null, 2));
  console.error("❌ Startup Error:", error instanceof Error ? error.stack : JSON.stringify(error));
    process.exit(1);
});