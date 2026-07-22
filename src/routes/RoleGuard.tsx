import React from "react";
import { Navigate } from "react-router-dom";
import { HOME } from "./types/routeConstants";

// Props for RoleGuard
type RoleGuardProps = {
  children: React.ReactNode;
  allowedRoles: string[]; // roles allowed to access this route
  userRole?: string;      // current user's role (could come from context or Redux)
};

const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles, userRole }) => {
  // Example: get user role from props or fallback
  const role = userRole || "guest";

  if (!allowedRoles.includes(role)) {
    // Redirect to home or 403 page if not allowed
    return <Navigate to={HOME} replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
