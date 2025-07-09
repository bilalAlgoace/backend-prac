import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
// import "./types/express/index";
// routes import
import userRouter from "./routes/user.routes.js";

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN
}));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

app.use(cookieParser());




// routes declaration

app.use("/api/v1/users", userRouter);

app.get("/", (req, res) => {  
  res.send({
    message: "Hello world from Algoace Udaid."
  });
})

export { app }