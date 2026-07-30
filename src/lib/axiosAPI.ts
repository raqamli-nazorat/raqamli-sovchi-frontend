import axios from "axios"

export const axiosAPI = axios.create({
     baseURL: import.meta.env.VITE_BASE_URL,
     paramsSerializer: {
          encode: (param) => param,
     },
})

// ── Har so'rovga access tokenni qo'shish ──
axiosAPI.interceptors.request.use((config) => {
     const token = localStorage.getItem("access")
     if (token && token !== "undefined" && token !== "null") {
          config.headers.Authorization = `Bearer ${token}`
     }
     return config
})

// ── 401 (token yaroqsiz/eskirgan) markazlashgan ishlovi ──
// Login so'rovini istisno qilamiz — u xatoni o'zi ko'rsatadi.
axiosAPI.interceptors.response.use(
     (response) => response,
     (error) => {
          const status = error?.response?.status
          const url = error?.config?.url || ""
          const isAuthRequest = url.includes("auth/token/")

          if (status === 401 && !isAuthRequest) {
               localStorage.removeItem("access")
               localStorage.removeItem("refresh")
               if (window.location.pathname !== "/login") {
                    window.location.href = "/login"
               }
          }
          return Promise.reject(error)
     }
)
