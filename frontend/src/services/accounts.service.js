import api from './api';

export async function getAccounts() {
  const { data } = await api.get('/accounts');
  return data;
}

export async function createAccount(payload) {
  const { data } = await api.post('/accounts', payload);
  return data;
}
