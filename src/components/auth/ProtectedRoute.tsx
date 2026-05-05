import { ReactNode, useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const notified = useRef(false);

  useEffect(() => {
    if (!isAuthenticated && !notified.current) {
      notified.current = true;
      toast({
        title: "로그인이 필요합니다",
        description: "먼저 로그인 후 이용해주세요.",
      });
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
