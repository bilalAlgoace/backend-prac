export type JwtDuration = '1s' | '15m' | '30m' | '1h' | '12h' | '1d' | '7d' | '10d';

export interface CustomRequestFiles {
  avatar?: Express.Multer.File[];
  coverImage?: Express.Multer.File[];
}