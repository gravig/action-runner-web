import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store";

function AuthGuard() {
  const token = useSelector((s: RootState) => s.auth.token);
  if (!token) return <Navigate to="/auth/login" replace />;
  return <Outlet />;
}

export default AuthGuard;
