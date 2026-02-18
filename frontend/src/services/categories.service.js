const API_URL = import.meta.env.VITE_API_URL;

const parseError = async (res) => {
  const data = await res.json().catch(() => ({}));
  return data.error || data.message || `Error ${res.status}: ${res.statusText}`;
};

const withAuth = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
});

export async function getCategories(token, type) {
  const query = type ? `?type=${encodeURIComponent(type)}` : '';
  const res = await fetch(`${API_URL}/categories${query}`, {
    headers: withAuth(token)
  });

  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function createCategory(payload, token) {
  const res = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: withAuth(token),
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function updateCategory(id, payload, token) {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: 'PUT',
    headers: withAuth(token),
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function deleteCategory(id, token) {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: withAuth(token)
  });

  if (!res.ok) throw new Error(await parseError(res));
}
