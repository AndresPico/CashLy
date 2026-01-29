import { useAuth } from '../../hooks/useAuth';

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="container mt-5">
      <h2>Bienvenido {user.email}</h2>
      <button className="btn btn-danger mt-3" onClick={logout}>
        Cerrar sesión
      </button>
    </div>
  );
}

export default Dashboard;
