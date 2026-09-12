/**
 * Standardized API and Network Error Formatter
 * 
 * Safely extracts user-facing error messages from Axios responses,
 * Zod validation error structures, and network failure objects.
 */

export function formatErrorMessage(error, fallback = "An unexpected error occurred. Please try again.") {
  if (!error) return fallback;

  if (typeof error === "string") return error;

  // Axios response error
  if (error.response?.data) {
    const data = error.response.data;

    // Direct error message string
    if (typeof data.message === "string" && data.message.trim()) {
      // If backend returns an array of Zod/validation issues in data.errors
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const issues = data.errors
          .map((err) => (typeof err === "string" ? err : err.message || JSON.stringify(err)))
          .filter(Boolean)
          .join("; ");
        if (issues) {
          return `${data.message}: ${issues}`;
        }
      }
      return data.message;
    }

    // Direct error property
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
  }

  // Network & Connectivity errors
  if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
    return "Unable to connect to the SecurePass server. Please check your network connection.";
  }

  if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
    return "Server request timed out. Please try again.";
  }

  // HTTP Status-specific fallbacks
  if (error.response?.status === 400) {
    return "Invalid request parameters. Please verify your input.";
  }

  if (error.response?.status === 401) {
    return "Your session has expired or is unauthorized. Please sign in.";
  }

  if (error.response?.status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (error.response?.status === 404) {
    return "The requested resource was not found.";
  }

  if (error.response?.status === 429) {
    return "Too many requests. Please wait a moment before trying again.";
  }

  if (error.response?.status >= 500) {
    return "Internal server error. Please try again in a few moments.";
  }

  return error.message || fallback;
}
