// kickApi.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://garbha.onrender.com//api/kicks/"; // <- change to your API

async function getToken() {
  // adjust key if you store token under a different key
  return await AsyncStorage.getItem("token");
}

async function apiFetch(path, options = {}) {
  const token = await getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const message = errBody.message || errBody.error || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = errBody;
    throw err;
  }
  return res.json();
}

export async function getOrCreateTodaySession() {
  // POST /today
  return apiFetch("/today", { method: "POST" });
}

export async function addKick(sessionId) {
  // POST /add { sessionId }
  return apiFetch("/add", {
    method: "POST",
    body: JSON.stringify({ sessionId }),
  });
}

export async function removeKick(sessionId) {
  // POST /remove { sessionId }
  return apiFetch("/remove", {
    method: "POST",
    body: JSON.stringify({ sessionId }),
  });
}

export async function getSummary(filter = "daily") {
  // GET /summary?filter=...
  return apiFetch(`/summary?filter=${encodeURIComponent(filter)}`, {
    method: "GET",
  });
}
