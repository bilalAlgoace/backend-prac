class ApiResponse<T = any> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;

  constructor(statusCode: number, data: T, message: string = "Success") {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}

export { ApiResponse };



// class ApiResponse {
//   constructor(statusCode, data, message="Success"){
//     this.statusCode = statusCode
//     this.data = data
//     this.message = message
//     this.success = statusCode < 400
//   }
// }