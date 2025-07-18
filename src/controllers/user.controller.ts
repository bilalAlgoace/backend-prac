import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { CustomRequestFiles, IUser, UserDocument } from "../types/types.js";
import mongoose from "mongoose";
// import "../types/express/index.js";

interface AuthenticatedRequest extends Request {
  user?: UserDocument;
}

const generateAccessAndRefreshToken = async (userId: any) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    console.log("Calling generateAccessToken...");
    const accessToken = user.generateAccessToken();

    console.log("Calling generateRefreshToken...");
    const refreshToken = user.generateRefreshToken();

    // const accessToken = "123456789"
    // const refreshToken = "987654321"
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };

  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating Access and Refresh token");
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
  console.log(email);
  if (!(username || email)) {
    throw new ApiError(400, "usernmae or email is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }]
  })

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const tokens = await generateAccessAndRefreshToken(user._id);

  if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
    throw new ApiError(500, "Failed to generate authentication tokens");
  }

  const { accessToken, refreshToken } = tokens;

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


const logoutUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  console.log("req.user", req.user);
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized request");
  }
  console.log("req.user", req.user);
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $unset: {
        refreshToken: 1 // this removes the field from document
      }
    },
    {
      new: true
    }
  );

  const options = {
    httpOnly: true,
    secure: true
  }

  res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User logged out"));
});


const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  try {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET!);
    if (!decodedToken || typeof decodedToken !== "object" || !("_id" in decodedToken)) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const tokens = await generateAccessAndRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: true
    }

    // if(!tokens || !tokens.accessToken || !tokens.refreshToken) {

    res.status(200).cookie("accessToken", tokens?.accessToken, options).cookie("refreshToken", tokens?.refreshToken, options).json(new ApiResponse(200, { accessToken: tokens?.accessToken, refreshToken: tokens?.refreshToken }, "Tokens refreshed successfully"));
  } catch (error: any) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});


const changeCurrentPassword = asyncHandler(async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "Invalid User");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Old Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, {}, "Password change successfully"));
});


const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(new ApiResponse(200, req.user, "User Data Fetched Successfully"));
});


const updateAccountDetails = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(req.user?._id, { $set: { fullName, email } }, { new: true }).select("-password");

  res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"));
});


const updateUserAvatar = asyncHandler(async (req: Request, res: Response) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar: any = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(req.user?._id, { $set: { avatar: avatar.url } }, { new: true }).select("-password");

  res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"));
});


const updateUserCoverImage = asyncHandler(async (req: Request, res: Response) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image file is missing");
  }

  const coverImage: any = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on cover image");
  }

  const user = await User.findByIdAndUpdate(req.user?._id, { $set: { coverImage: coverImage.url } }, { new: true }).select("-password");

  res.status(200).json(new ApiResponse(200, user, "cover image updated successfully"));
});


const getUserChannelProfile = asyncHandler(async (req: Request, res: Response) => {
  const { username } = req.params;

  if (!username.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscribers.subscriber"]
            },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        _id: 1,
        fullName: 1,
        username: 1,
        email: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        createdAt: 1,
        updatedAt: 1
      }
    }
  ]);

  if (!channel.length) {
    throw new ApiError(404, "channel does not exist");
  }

  res.status(200).json(new ApiResponse(200, channel[0], "User channel fetched successfully"));

});


const getWatchHistory = asyncHandler(async (req: Request, res: Response) => {

  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                    coverImage: 1,
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
  ]);

  res.status(200).json(new ApiResponse(200, user[0]?.watchHistory, "Watch history fetched successfully"));
});


export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
}