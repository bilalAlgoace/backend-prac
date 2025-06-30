import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { CustomRequestFiles } from "../types/types.js";


const generateAccessAndRefreshToken = async (userId: any) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // const accessToken = "123456789"
    // const refreshToken = "987654321"

    // user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };

  } catch (error) {
    console.error("Token Generation Error:", error);

    // If error is an instance of Error, show full stack trace
    // if (error instanceof Error) {
    //   console.error("Stack Trace:", error.stack);
    // }
  
    // throw new ApiError(500, "Something went wrong while generating Access and Refresh token");
  }
}


const registerUser = asyncHandler(async (req: Request, res: Response) => {
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

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  let coverImage;

  if (!avatar) {
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

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  res.status(201).json(
    new ApiResponse(200, createdUser, "User created successfully")
  );
});


const loginUser = asyncHandler(async (req: Request, res: Response) => {
  // req body -> data
  // username or email
  // find the user
  // password check
  // access and refresh token
  // send cookie

  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "usernmae or email is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true
  }

  res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
    new ApiResponse(200, {
      user: loggedInUser, accessToken, refreshToken
    },
      "User logged In Successfully"
    )
  );
});


// const logoutUser = asyncHandler(async (req: Request, res: Response) => {
//   await User.findByIdAndUpdate(req.user?._id,
//     {
//       $set: {
//         refreshToken: undefined
//       }
//     },
//     {
//       new: true
//     }
//   );

//   const options = {
//     httpOnly: true,
//     secure: true
//   }

//   res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User logged out"));
// });

export {
  registerUser,
  // loginUser,
  // logoutUser
}