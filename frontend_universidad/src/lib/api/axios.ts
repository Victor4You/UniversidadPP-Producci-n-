import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://194.113.64.53:3013/v1";

const api = axios.create({
  // Quitamos el /v1 de aquí
  baseURL: BASE_URL.replace(/\/$/, ""), 
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor mejorado
api.interceptors.request.use((config) => {
  const session = Cookies.get("univ_auth_session");
  if (session) {
    try {
      const user = JSON.parse(session);
      // Intentamos extraer el token de las rutas posibles
      const token = user.token || user.accessToken || (user.data && user.data.token);
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error("Error parseando sesión:", e);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
