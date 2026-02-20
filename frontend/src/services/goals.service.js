const API_URL = import.meta.env.VITE_API_URL;

const parseError = async (res) => {
  const data = await res.json().catch(() => ({}));
  return data.error || data.message || `Error ${res.status}: ${res.statusText}`;
};

const withAuth = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
});

export async function getGoals(token) {
  const res = await fetch(`${API_URL}/goals`, {
    headers: withAuth(token)
  });

  if (!res.ok) throw new Error(await parseError(res));

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function createGoal(payload, token) {
  const res = await fetch(`${API_URL}/goals`, {
    method: 'POST',
    headers: withAuth(token),
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function updateGoal(id, payload, token) {
  const res = await fetch(`${API_URL}/goals/${id}`, {
    method: 'PUT',
    headers: withAuth(token),
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function deleteGoal(id, token) {
  const res = await fetch(`${API_URL}/goals/${id}`, {
    method: 'DELETE',
    headers: withAuth(token)
  });

  if (!res.ok) throw new Error(await parseError(res));
}

export async function getGoalContributions(goalId, token) {
  const res = await fetch(`${API_URL}/goals/${goalId}/contributions`, {
    headers: withAuth(token)
  });

  if (!res.ok) throw new Error(await parseError(res));

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function createGoalContribution(goalId, payload, token) {
  const res = await fetch(`${API_URL}/goals/${goalId}/contributions`, {
    method: 'POST',
    headers: withAuth(token),
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function updateGoalContribution(goalId, contributionId, payload, token) {
  const res = await fetch(`${API_URL}/goals/${goalId}/contributions/${contributionId}`, {
    method: 'PUT',
    headers: withAuth(token),
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function deleteGoalContribution(goalId, contributionId, token) {
  const res = await fetch(`${API_URL}/goals/${goalId}/contributions/${contributionId}`, {
    method: 'DELETE',
    headers: withAuth(token)
  });

  if (!res.ok) throw new Error(await parseError(res));
}
