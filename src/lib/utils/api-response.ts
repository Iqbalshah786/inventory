import type { ApiResponse } from "@/types";

export function success<T>(data: T, message = "Success"): ApiResponse<T> {
  return { success: true, message, data };
}

export function error(message = "Something went wrong"): ApiResponse<never> {
  return { success: false, message };
}
