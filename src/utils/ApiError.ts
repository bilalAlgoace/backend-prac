class ApiError extends Error {
  statusCode: number;
  data: any | null;
  success: boolean;
  // errors: any[];
  
  constructor(
    statusCode: number, 
    message: string = "Something went wrong", 
    // errors: any[] = [], 
    stack: string = ""
  ) {
    super();

    this.statusCode = statusCode;
    this.success = false;
    this.message = message;
    this.data = null;
    // this.errors = errors;

    // Set the stack trace if provided or capture it automatically
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };




// class ApiError extends Error {
//   constructor(statusCode, message="Something went wrong", errors=[], stack=""){
//     super(message)
//     this.statusCode = statusCode
//     this.data = null
//     this.message = message
//     this.success = false
//     this.errors = errors

//     if(stack) {
//       this.stack = stack
//     } else {
//       Error.captureStackTrace(this, this.constructor)
//     }
//   }
// }

// export {ApiError}