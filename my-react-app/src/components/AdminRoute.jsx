import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const role = localStorage.getItem("userRole");

  if (isLoggedIn !== "true" || role !== "Admin") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default AdminRoute;x