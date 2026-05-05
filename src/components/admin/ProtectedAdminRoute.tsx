import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const ProtectedAdminRoute = ({ children }: { children: ReactNode }) => {
  const { isAdmin } = useAdminAuth();
  const location = useLocation();
  if (!isAdmin) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }
  return <>{children}</>;
};

export default ProtectedAdminRoute;
