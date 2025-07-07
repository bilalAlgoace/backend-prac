// types/express/index.d.ts
// import { UserDocument } from "../types/types";
import { UserDocument } from "../types.js";

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}

// import { UserDocument } from "../types";


// declare global {
//   namespace Express {
//     interface Request {
//       user: UserDocument;
//     }
//   }
// }

// export {}; // VERY IMPORTANT to ensure this is treated as a module