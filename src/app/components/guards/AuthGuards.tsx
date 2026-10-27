import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useApp } from "../../context/AppContext";
import { rememberMapCheckpoint } from "../../../lib/floor-checkpoints";

export function AuthGuard() {
  const { isLoadingAuth, isAuthenticated } = useApp();

  if (isLoadingAuth) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function ApprovedGuard() {
  const { isLoadingAuth, isAuthenticated, isApproved } = useApp();
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (!isLoadingAuth && (!isAuthenticated || !isApproved) && pathname === "/app/map") {
      rememberMapCheckpoint(search);
    }
  }, [isLoadingAuth, isAuthenticated, isApproved, pathname, search]);

  if (isLoadingAuth) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  return <Outlet />;
}

export function AdminGuard() {
  const { isLoadingAuth, isAuthenticated, isApproved, currentUser } = useApp();

  if (isLoadingAuth) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (currentUser.role !== "admin") {
    return <Navigate to="/app/home" replace />;
  }

  return <Outlet />;
}

export function FacultyGuard() {
  const { isLoadingAuth, isAuthenticated, isApproved, currentUser } = useApp();

  if (isLoadingAuth) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (currentUser.role !== "faculty") {
    return <Navigate to="/app/home" replace />;
  }

  return <Outlet />;
}

export function ITSupportGuard() {
  const { isLoadingAuth, isAuthenticated, isApproved, currentUser } = useApp();

  if (isLoadingAuth) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (currentUser.role !== "it_support") {
    return <Navigate to="/app/home" replace />;
  }

  return <Outlet />;
}
