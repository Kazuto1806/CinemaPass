import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const role = localStorage.getItem("userRole");
  const authToken = localStorage.getItem("authToken");

  if (isLoggedIn !== "true" || role !== "Admin" || !authToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default AdminRoute;