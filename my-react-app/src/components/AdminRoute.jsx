import { Navigate, useLocation } from "react-router-dom";

function AdminRoute({ children }) {
  const location = useLocation();
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const role = localStorage.getItem("userRole");
  const authToken = localStorage.getItem("authToken");

  if (isLoggedIn !== "true" || role !== "Admin" || !authToken) {
    const returnUrl = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/login?returnUrl=${encodeURIComponent(returnUrl)}`}
        replace
      />
    );
  }

  return children;
}

export default AdminRoute;