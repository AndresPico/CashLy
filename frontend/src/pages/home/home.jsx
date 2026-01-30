import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

const Home = () => {
  const { user, logout } = useAuth();

  return (
    <div style={styles.container}>
      <h1>💸 Cashly</h1>

      <p style={styles.subtitle}>
        Bienvenido{user?.email ? `, ${user.email}` : ''}
      </p>

      <div style={styles.grid}>
        <Link to="/api/accounts" style={styles.card}>🏦 Accounts</Link>
        <Link to="/api/transactions" style={styles.card}>💳 Transactions</Link>
        <Link to="/api/categories" style={styles.card}>🏷 Categories</Link>
        <Link to="/api/budgets" style={styles.card}>📊 Budgets</Link>
        <Link to="/api/goals" style={styles.card}>🎯 Goals</Link>
      </div>

      <button onClick={logout} style={styles.logout}>
        Cerrar sesión
      </button>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '900px',
    margin: '0 auto',
    textAlign: 'center'
  },
  subtitle: {
    color: '#666',
    marginBottom: '2rem'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem'
  },
  card: {
    padding: '1.5rem',
    borderRadius: '10px',
    background: '#f5f5f5',
    textDecoration: 'none',
    color: '#333',
    fontWeight: '600',
    transition: '0.2s',
  },
  logout: {
    background: '#ff4d4f',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer'
  }
};

export default Home;
