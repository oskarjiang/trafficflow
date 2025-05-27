import React from "react";

interface ErrorMessageProps {
  message: string | null;
}

/**
 * Reusable error message component
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;

  return <div className="error-message">{message}</div>;
};

export default ErrorMessage;
