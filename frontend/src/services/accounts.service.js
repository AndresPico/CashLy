const API_URL = import.meta.env.VITE_API_URL;

export async function getAccounts(token) {
  try {
    const res = await fetch(`${API_URL}/accounts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching accounts:', error);
    throw error;
  }
}

export async function createAccount(data, token) {
  try {
    const res = await fetch(`${API_URL}/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
}

export async function updateAccount(id, data, token) {
  try {
        console.log('=== ENVIANDO PETICIÓN PUT ===');
        console.log('URL:', `${API_URL}/accounts/${id}`);
        console.log('Datos a enviar:', data);
        console.log('============================');
    const res = await fetch(`${API_URL}/accounts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error updating account:', error);
    throw error;
  }
}

export async function deleteAccount(id, token) {
  try {
    const res = await fetch(`${API_URL}/accounts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${res.status}: ${res.statusText}`);
    }

    // Algunas APIs no devuelven contenido en DELETE
    if (res.status !== 204) {
      return await res.json();
    }
    
    return { success: true, message: 'Cuenta eliminada correctamente' };
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
}