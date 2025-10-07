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

      const { status, messgae, config } = response;
      const isLoginRoute = window.location.pathname.startsWith("/login");

      if (
        status === 401 &&
        !isLoginRoute &&
        messgae &&
        messgae.includes("token")
      ) {
        console.warn("Auth expired or missing → redirecting to login…");
        localStorage.removeItem("token");

        setTimeout(() => {
          window.location.replace("/login");
        }, 300);
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
