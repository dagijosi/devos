import React from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  isPublicOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  return <>{children}</>;
};

export default ProtectedRoute;
