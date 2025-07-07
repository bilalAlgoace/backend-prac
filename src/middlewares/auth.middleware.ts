import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { UserDocument } from "../types/types.js";

interface AuthenticatedRequest extends Request {
  user?: UserDocument;
}

export const verifyJWT = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
  
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }
  
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
  
    // ✅ Type check to ensure it's a JwtPayload
    if (typeof decodedToken !== "object" || !("_id" in decodedToken)) {
      throw new ApiError(401, "Invalid token payload");
    }
  
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
  
    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }
  
    req.user = user as UserDocument;
  
    next();
  } catch (error: any) {
    console.log("AUTH ERROR", error);
    throw new ApiError(401, error?.message || "Invalid access token")
  }
})










//     import { ApiError } from "../utils/ApiError.js";
// import { asyncHandler } from "../utils/asyncHandler.js";
// import jwt from "jsonwebtoken"
// import { User } from "../models/user.model.js";

// export const verifyJWT = asyncHandler(async(req, _, next) => {
//     try {
//         const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
//         // console.log(token);
//         if (!token) {
//             throw new ApiError(401, "Unauthorized request")
//         }
    
//         const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
//         const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
//         if (!user) {
            
//             throw new ApiError(401, "Invalid Access Token")
//         }
    
//         req.user = user;
//         next()
//     } catch (error) {
//         throw new ApiError(401, error?.message || "Invalid access token")
//     }
    
// })