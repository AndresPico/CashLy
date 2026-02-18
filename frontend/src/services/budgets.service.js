const API_URL = import.meta.env.VITE_API_URL;

const parseError = async (res) => {
  const data = await res.json().catch(() => ({}));
  return data.error || data.message || `Error ${res.status}: ${res.statusText}`;
};

const withAuth = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
});

export async function getBudgets(token, month) {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  const res = await fetch(`${API_URL}/budgets${query}`, {
    headers: withAuth(token)
  });

  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    summary: data?.summary || null
  };
}

export async function createBudget(payload, token) {
  const res = await fetch(`${API_URL}/budgets`, {
    method: 'POST',
    headers: withAuth(token),
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function updateBudget(id, payload, token) {
  const res = await fetch(`${API_URL}/budgets/${id}`, {
    method: 'PUT',
    headers: withAuth(token),
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function deleteBudget(id, token) {
  const res = await fetch(`${API_URL}/budgets/${id}`, {
    method: 'DELETE',
    headers: withAuth(token)
  });

  if (!res.ok) throw new Error(await parseError(res));
}
