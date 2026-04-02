const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_URL = isLocal
  ? 'http://localhost:5000/api'
  : 'https://ai-exam-portal-1.onrender.com/api';

export const getAuthToken = () => {
  const user = JSON.parse(localStorage.getItem('auth_user'));
  return user?.token || '';
};

export const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || response.statusText);
  }

  return data;
};
