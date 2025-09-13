import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  allowDevMode?: boolean; // Allow bypassing auth for development
}

const ProtectedRoute = ({ children, allowDevMode = false }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    // You can replace this with a proper loading component
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is authenticated, always allow access
  if (user) {
    return <>{children}</>;
  }

  // If no user and dev mode is allowed, continue (fallback to mock user)
  if (allowDevMode) {
    return <>{children}</>;
  }

  // No user and no dev mode - redirect to login
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;
