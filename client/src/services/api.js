// The only file that talks to the backend. Components never call fetch directly.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'campus-events-token';

// localStorage can be blocked (private windows, strict settings), so every access is guarded.
// Trade-off: a token in localStorage is readable by any script on the page, so this app
// avoids rendering untrusted HTML and keeps token lifetime short.
export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore: user stays logged in for this tab only */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function request(path, { method = 'GET', body, query } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  const params = new URLSearchParams();
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  const queryString = params.toString() ? `?${params}` : '';

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}${queryString}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }

  let data = null;
  if (response.status !== 204) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && token && onUnauthorized) onUnauthorized();
    throw new ApiError(data?.message || 'Something went wrong. Please try again.', response.status);
  }
  return data;
}

export const authApi = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),
};

export const eventsApi = {
  list: (query) => request('/events', { query }),
  get: (id) => request(`/events/${id}`),
  create: (payload) => request('/events', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/events/${id}`, { method: 'PUT', body: payload }),
  remove: (id) => request(`/events/${id}`, { method: 'DELETE' }),
  register: (id) => request(`/events/${id}/register`, { method: 'POST' }),
  cancel: (id) => request(`/events/${id}/register`, { method: 'DELETE' }),
  registrations: (id) => request(`/events/${id}/registrations`),
};

export const registrationsApi = {
  mine: () => request('/registrations/me'),
};
