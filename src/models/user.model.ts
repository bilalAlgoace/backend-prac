import mongoose, { Schema } from "mongoose";
import jwt, { Secret, SignOptions  } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { JwtDuration } from "../types/types";

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  avatar: {
    type: String,
    required: true,
  },
  coverImage: {
    type: String,
  },
  watchHistory: [
    {
      type: Schema.Types.ObjectId,
      ref: "Video"
    }
  ],
  password: {
    type: String,
    required: [true, "Password is required"]
  },
  refreshToken: {
    type: String,
  }
}, { timestamps: true });

// Hashing Password
userSchema.pre("save", async function (next) {
  if(! this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Validating Password
userSchema.methods.isPasswordCorrect = async function (password: string) {
  return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken = function () {
  const secret: Secret = process.env.ACCESS_TOKEN_SECRET as string;
  const expiry = (process.env.ACCESS_TOKEN_EXPIRY as JwtDuration) ?? '1d';

  const payload = {
    _id: this._id,
    email: this.email,
    username: this.username,
    fullName: this.fullName,
  };

  const options: SignOptions = {
    expiresIn: expiry,
  };

  return jwt.sign(payload, secret, options);
  
}

userSchema.methods.generateRefreshToken = function () {
  const secret: Secret = process.env.REFRESH_TOKEN_SECRET as string;
  const expiry = (process.env.REFRESH_TOKEN_EXPIRY as JwtDuration) ?? '10d';

  const payload = {
    _id: this._id,
  };

  const options: SignOptions = {
    expiresIn: expiry,
  };

  return jwt.sign(payload, secret, options);
}

export const User = mongoose.model("User", userSchema);

// const secret = process.env.ACCESS_TOKEN_SECRET;
//   const expiry = process.env.ACCESS_TOKEN_EXPIRY;

//   if (!secret) {
//     throw new Error('ACCESS_TOKEN_SECRET is not defined');
//   }
//   return jwt.sign(
//     {
//       _id: this._id,
//       email: this.email,
//       username: this.username,
//       fullName: this.fullName
//     },
//     secret,
//     {
//       expiresIn: expiry || '1h' // fallback if expiry is not defined
//     }
//   );