import axios from "axios";
import { getActiveToken } from "../auth/accounts";

export const apiClient = axios.create({
   baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
});

apiClient.interceptors.request.use((config) => {
   const token = getActiveToken();
   if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
   }
   return config;
});
