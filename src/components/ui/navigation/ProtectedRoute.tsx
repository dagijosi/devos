import React from "react";
import { Navigate, useLocation } from "react-router-dom";

import { HOME, LOGIN } from "../../../routes/types/routeConstants";
import { useAuthStore } from "../../../store/authStore";



interface ProtectedRouteProps {
  children: React.ReactNode;
  isPublicOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, isPublicOnly }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore((state) => state);

  if (isPublicOnly && isAuthenticated) {
    return <Navigate to={HOME} replace />;
  }

  if (!isPublicOnly && !isAuthenticated) {
    return <Navigate to={LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
