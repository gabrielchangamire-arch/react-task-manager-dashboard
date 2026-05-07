import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const http = axios.create({
  baseURL,
  timeout: 8000,
  headers: { "Content-Type": "application/json" },
});

function unwrap(err) {
  if (err.response) {
    const detail = err.response.data?.detail;
    return new Error(typeof detail === "string" ? detail : `request failed (${err.response.status})`);
  }
  if (err.request) return new Error("could not reach the API. is the backend running?");
  return new Error(err.message || "unknown error");
}

export const tasksApi = {
  async list() {
    try {
      const res = await http.get("/tasks");
      return res.data;
    } catch (err) {
      throw unwrap(err);
    }
  },
  async create({ title, description = null, status = "pending" }) {
    try {
      const res = await http.post("/tasks", { title, description, status });
      return res.data;
    } catch (err) {
      throw unwrap(err);
    }
  },
  async update(id, patch) {
    try {
      const res = await http.put(`/tasks/${id}`, patch);
      return res.data;
    } catch (err) {
      throw unwrap(err);
    }
  },
  async remove(id) {
    try {
      await http.delete(`/tasks/${id}`);
    } catch (err) {
      throw unwrap(err);
    }
  },
  async health() {
    try {
      const res = await http.get("/health");
      return res.data;
    } catch (err) {
      throw unwrap(err);
    }
  },
};
