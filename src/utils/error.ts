import { toast } from "sonner";

export class CustomError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "CustomError"; // nice to have for debugging
    this.statusCode = statusCode;

    Object.setPrototypeOf(this, CustomError.prototype); // TS/JS fix
  }
}


export const handleError = (error: unknown) => {
  if (error instanceof CustomError) {
    switch (error.statusCode) {
      case 400:
        toast.error("Bad Request – check your input");
        break;
      case 401:
        toast.error("Unauthorized – please login again");
        break;
      case 403:
        toast.error("Forbidden – you don’t have access");
        break;
      case 500:
        toast.error("Server error – try later");
        break;
      default:
        toast.error(error.message || "Something went wrong");
    }
  } else {
    toast.error("Unexpected error occurred");
  }
};
