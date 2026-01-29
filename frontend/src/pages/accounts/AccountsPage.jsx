import { useEffect, useState } from 'react';
import { getAccounts } from '../../services/accounts.service';

function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAccounts()
      .then(setAccounts)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="container mt-4">
      <h3>Accounts</h3>
      <ul className="list-group">
        {accounts.map((acc) => (
          <li key={acc.id} className="list-group-item d-flex justify-content-between">
            <span>{acc.name}</span>
            <strong>${acc.balance}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AccountsPage;
