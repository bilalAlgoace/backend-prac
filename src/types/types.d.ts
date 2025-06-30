export type JwtDuration = '1s' | '15m' | '30m' | '1h' | '12h' | '1d' | '7d' | '10d';

export interface CustomRequestFiles {
  avatar?: Express.Multer.File[];
  coverImage?: Express.Multer.File[];
}

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