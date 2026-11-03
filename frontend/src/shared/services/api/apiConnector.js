import axios from "axios";
import { markRequestStart, markRequestEnd, notifySuccessfulMutation } from "./requestActivity";

export const axiosInstance = axios.create({
  withCredentials: true,
});

const READ_METHODS = ["get", "head", "options"];

const finishTracking = (config) => {
  if (config?.requestActivityId) markRequestEnd(config.requestActivityId);
};

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
      if (!config.skipActivityTracking) config.requestActivityId = markRequestStart();
      return config;
    },
    (error) => Promise.reject(error)
  );

  axiosInstance.interceptors.response.use(
    (response) => {
      finishTracking(response.config);
      const method = String(response.config?.method || "get").toLowerCase();
      if (!READ_METHODS.includes(method)) notifySuccessfulMutation(method, response.config?.url || "");
      return response;
    },
    (error) => {
      finishTracking(error?.config);
      const response = error?.response;
      if (!response) return Promise.reject(error);

      const { status } = response;
      const isLoginRoute = window.location.pathname.startsWith("/login");

      if (status === 401 && !isLoginRoute) {
        const msg = (response.data?.message || "").toLowerCase();
        const isSessionError =
          msg.includes("token") ||
          msg.includes("missing") ||
          msg.includes("decoding") ||
          msg.includes("unauthorized");

        if (isSessionError) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setTimeout(() => {
            window.location.replace("/login");
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
