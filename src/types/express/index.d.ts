import { UserDocument } from "../types";


declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}

export {}; // VERY IMPORTANT to ensure this is treated as a module