import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { CustomRequestFiles } from "../types/types.js";


const registerUser = asyncHandler(async(req: Request, res: Response) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation 
  // return response
  const { fullName, email, username, password } = req.body;

  // if(fullName === "") {
  //   throw new ApiError(400, "fullName is required");
  // }

  if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All feilds are required");
  }

  const alreadyExists = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (alreadyExists) {
    throw new ApiError(409, "User with this email/username already exists!");
  }

  const files = req.files as any;
  const avatarLocalPath = files.avatar?.[0]?.path;
  const coverImageLocalPath = files.coverImage?.[0]?.path;

  if(!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  let coverImage;

  if(!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    username: username.toLowerCase(),
    password
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if(!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  res.status(201).json(
    new ApiResponse(200, createdUser, "User created successfully") 
  );
});

export {
  registerUser
}