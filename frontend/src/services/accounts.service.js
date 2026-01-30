const API_URL = import.meta.env.VITE_API_URL;

export async function getAccounts(token) {
  const res = await fetch(`${API_URL}/accounts`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error('Error fetching accounts');
  }

  return res.json();
}

export async function createAccount(data, token) {
  const res = await fetch(`${API_URL}/accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    throw new Error('Error creating account');
  }

  return res.json();
}
