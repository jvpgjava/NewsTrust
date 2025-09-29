import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.newstrust.me"

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available (only on client side)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem("authToken")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Handle unauthorized access (only on client side)
      localStorage.removeItem("authToken")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// API methods
export const newsAPI = {
  analyze: (newsData) => api.post("/analysis", newsData),
  getAll: (params) => api.get("/news", { params }),
  getById: (id) => api.get(`/news/${id}`),
  create: (newsData) => api.post("/news", newsData),
  delete: (id) => api.delete(`/news/${id}`),
}

export const contentAnalysisAPI = {
  analyze: (contentData) => api.post("/api/content-analysis", contentData),
}

export const sourceAnalysisAPI = {
  analyze: (sourceData) => api.post("/api/source-analysis", sourceData),
}

export const graphAPI = {
  getStats: () => api.get("/api/graph/stats"),
  getGraph: () => api.get("/api/graph"),
  getConnections: () => api.get("/api/graph/connections"),
}
