function getToken() {
  try { return localStorage.getItem('synex_token'); } catch { return null; }
}

export function apiFetch(url, options = {}) {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...options.headers,
    },
  });
}
