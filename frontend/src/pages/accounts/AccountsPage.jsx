import { useEffect, useState } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import {
  getAccounts,
  createAccount
} from '../../services/accounts.service';
import AccountsForm from './AccountsForm';

export default function AccountsPage() {
  const { token, loading: authLoading } = useAuthContext();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar accounts cuando el token esté listo
  useEffect(() => {
    if (authLoading) return;
    if (!token) return;

    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, token]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getAccounts(token);

      // Caso default: no hay cuentas aún
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (accountData) => {
    try {
      await createAccount(accountData, token);
      await loadAccounts(); // refresh
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error creating account');
    }
  };

  if (authLoading || loading) {
    return <p>Cargando accounts...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div>
      <h2>🏦 Accounts</h2>

      <AccountsForm onSubmit={handleCreate} />

      {accounts.length === 0 ? (
        <p>No tienes cuentas todavía. Crea tu primera cuenta 👇</p>
      ) : (
        <ul>
          {accounts.map((acc) => (
            <li key={acc.id}>
              <strong>{acc.name}</strong> — ${acc.balance}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
