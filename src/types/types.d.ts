import { Document } from "mongoose";

export type JwtDuration = '1s' | '15m' | '30m' | '1h' | '12h' | '1d' | '7d' | '10d';

export interface CustomRequestFiles {
  avatar?: Express.Multer.File[];
  coverImage?: Express.Multer.File[];
}

export interface Video {
  videoFile: string;
  thumbnail: string;
  title: string;
  description: string;
  duration: number;
  views?: number;
  isPublished?: boolean;
  owner: Types.ObjectId; // or use `string` if you're referencing ID as plain string
}
export interface IUser {
  username: string;
  email: string;
  fullName: string;
  password: string;
  avatar: string;
  coverImage?: string;
  refreshToken?: string;
  watchHistory: Types.ObjectId[];
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}


// export interface IUser {
//   username: string;
//   email: string;
//   fullName: string;
//   password: string;
// }
// export interface IUser {
//   username: string;
//   email: string;
//   fullName: string;
//   avatar: string;
//   coverImage?: string;
//   password: string;
//   refreshToken?: string;
// }
// export interface UserMethods {
//   isPasswordCorrect(password: string): Promise<boolean>;
//   generateAccessToken(): string;
//   generateRefreshToken(): string;
// }

export interface UserDocument extends Document {
  _id: string;
  email: string;
  username: string;
  fullName: string;
  avatar: string;
  coverImage?: string;
  password: string;
  refreshToken?: string;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  // Add other properties here
}