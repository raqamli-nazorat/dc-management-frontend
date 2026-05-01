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
  // "undefined" string bo'lsa token qo'shmaymiz
  if (token && token !== "undefined" && token !== "null") {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem("access");
      const hasRealToken = token && token !== "undefined" && token !== "null";
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      // Faqat haqiqiy token bo'lsa redirect qilamiz
      if (hasRealToken && window.location.pathname !== "/login") {
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export { axiosAPI };
