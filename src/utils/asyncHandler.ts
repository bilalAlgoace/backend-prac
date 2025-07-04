import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ApiError } from './ApiError.js';

const asyncHandler = (requestHandler: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) => {
      // If it's already an instance of ApiError, pass it along
      // if (error instanceof ApiError) {
      //   return next(error);
      // }

      // Otherwise, wrap it into a standardized ApiError
      const apiError = new ApiError(
        error.statusCode || 500,
        error.message || "Internal Server Error",
        // [error?.details || error],
        error.stack
      );
      return res.json(apiError)
      // return next(error)
    });
  }
}

export {asyncHandler}

// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async () => {}

// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message
//     });
//   }
// }