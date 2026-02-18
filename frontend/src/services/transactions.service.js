const API_URL = import.meta.env.VITE_API_URL;

const buildQueryString = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `?${query}` : '';
};

const parseError = async (res) => {
  const data = await res.json().catch(() => ({}));
  return data.error || data.message || `Error ${res.status}: ${res.statusText}`;
};

export async function getTransactions(token, filters = {}) {
  const query = buildQueryString(filters);
  const res = await fetch(`${API_URL}/transactions${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function createTransaction(payload, token) {
  const res = await fetch(`${API_URL}/transactions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json();
}

export async function updateTransaction(id, payload, token) {
  const res = await fetch(`${API_URL}/transactions/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json();
}

export async function deleteTransaction(id, token) {
  const res = await fetch(`${API_URL}/transactions/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }
}
