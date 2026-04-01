export const API_URL = 'http://localhost:5000/api';

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
