export class ApiResponseDto<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;

  constructor(success: boolean, message: string, data?: T, error?: any) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.error = error;
  }

  static success<T>(message: string, data?: T): ApiResponseDto<T> {
    return new ApiResponseDto<T>(true, message, data);
  }

  static error<T>(message: string, error?: any): ApiResponseDto<T> {
    return new ApiResponseDto<T>(false, message, undefined, error);
  }
}
