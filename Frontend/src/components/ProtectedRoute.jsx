import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext.jsx";

function ProtectedRoute({
  roles,
}) {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight:
            "100vh",
          display:
            "grid",
          placeItems:
            "center",
        }}
      >
        Memeriksa sesi...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    Array.isArray(roles) &&
    roles.length > 0 &&
    !roles.includes(user.role)
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
