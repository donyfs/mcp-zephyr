/**
 * Utility function to format errors with full response details
 */
export function formatError(error, operation) {
  const errorMessage = `Error ${operation}: ${error.message}\nError Detail:\n${JSON.stringify(error, null, 2)}`;
  return errorMessage;
}