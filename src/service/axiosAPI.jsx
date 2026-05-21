import axios from "axios";

const axiosAPI = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  paramsSerializer: {
    serialize: (params) => {
      return Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => {
          const encoded = String(v).replace(/\+/g, '%2B')
          return `${encodeURIComponent(k)}=${encoded}`
        })
        .join('&')
    },
  },
});

axiosAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token && token !== "undefined" && token !== "null") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

const doLogout = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

axiosAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refresh");
    const hasRealToken = localStorage.getItem("access");
    const hasRealToken2 = hasRealToken && hasRealToken !== "undefined" && hasRealToken !== "null";

    // Agar access token bo'lmasa yoki refresh token yo'q bo'lsa — logout
    if (!hasRealToken2 || !refreshToken || refreshToken === "undefined" || refreshToken === "null") {
      if (hasRealToken2) doLogout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Refresh ketayotganda boshqa so'rovlarni navbatga qo'yamiz
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosAPI(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const baseURL = (import.meta.env.VITE_BASE_URL ?? "").replace(/\/$/, "");
      const res = await axios.post(
        `${baseURL}/auth/refresh`,
        { refresh: refreshToken }
      );
      const newAccess = res.data?.access ?? res.data?.data?.access;
      if (!newAccess) throw new Error("No access token in refresh response");

      localStorage.setItem("access", newAccess);
      axiosAPI.defaults.headers.common["Authorization"] = `Bearer ${newAccess}`;
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;

      processQueue(null, newAccess);
      return axiosAPI(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      doLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export { axiosAPI };
