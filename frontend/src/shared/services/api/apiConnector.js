import axios from "axios";

export const axiosInstance = axios.create({
  withCredentials: true,
});

const setupInterceptors = () => {
  axiosInstance.interceptors.request.use(
    (config) => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers = config.headers || {};
          config.headers["Authorization"] = `Bearer ${token}`;
        }
      } catch (err) {
        console.warn("Error attaching token to request", err);
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

      const { status, data } = response;

      if (
        status === 401 &&
        data &&
        ["TOKEN_EXPIRED", "TOKEN_MISSING", "TOKEN_INVALID"].includes(data.code)
      ) {
        try {
          localStorage.removeItem("token");
          window.location.replace("/login");
        } catch (e) {
          window.location.replace("/login");
        }

        return Promise.reject(error);
      }

      return Promise.reject(error);
    }
  );
};

setupInterceptors();

export const apiConnector = (method, url, bodyData, headers, params) => {
  return axiosInstance({
    method: `${method}`,
    url: `${url}`,
    data: bodyData ? bodyData : null,
    headers: headers ? headers : null,
    params: params ? params : null,
  });
};
