let isRedirectingAfterUnauthorized = false;

function clearAuthSession() {
  [
    "isLoggedIn",
    "authToken",
    "userId",
    "userEmail",
    "userName",
    "phone",
    "birthDate",
    "role",
    "userRole",
  ].forEach((key) => localStorage.removeItem(key));
}

export function authenticatedFetch(input, init = {}) {
  const headers = new Headers(init.headers);
  const token = localStorage.getItem("authToken");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers }).then((response) => {
    if (
      response.status === 401 &&
      token &&
      window.location.pathname !== "/login" &&
      !isRedirectingAfterUnauthorized
    ) {
      isRedirectingAfterUnauthorized = true;
      clearAuthSession();
      window.dispatchEvent(new Event("userLogout"));

      const returnUrl = `${window.location.pathname}${window.location.search}`;
      window.location.replace(
        `/login?authExpired=1&returnUrl=${encodeURIComponent(returnUrl)}`
      );
    }

    return response;
  });
}
