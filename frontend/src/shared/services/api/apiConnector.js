import axios from "axios";

export const axiosInstance = axios.create({
  withCredentials: true,
});

let interceptorsInitialized = false;

export const setupAxiosInterceptors = () => {
  if (interceptorsInitialized) return;
  interceptorsInitialized = true;

  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers = config.headers || {};
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      const response = error?.response;
      if (!response) return Promise.reject(error);

      const { status } = response;
      const isLoginRoute = window.location.pathname.startsWith("/login");

      if (status === 401 && !isLoginRoute) {
        // Distinguish session-invalid 401s (token missing/expired) from role-guard 401s
        // ("protected only for Instructor/Student/Admin"). Only clear session for the former.
        const msg = (response.data?.message || response.data?.messgae || "").toLowerCase();
        const isSessionError =
          msg.includes("token") ||
          msg.includes("missing") ||
          msg.includes("decoding") ||
          msg.includes("unauthorized");

        if (isSessionError) {
          console.warn("Session invalid → clearing session and redirecting");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setTimeout(() => {
            window.location.replace("/");
          }, 300);
        }
      }

      return Promise.reject(error);
    }
  );
};

export const apiConnector = (method, url, bodyData, headers, params) => {
  return axiosInstance({
    method,
    url,
    data: bodyData ?? null,
    headers: headers ?? null,
    params: params ?? null,
  });
};
