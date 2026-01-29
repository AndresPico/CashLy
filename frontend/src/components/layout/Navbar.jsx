import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function Navbar() {
  const { logout } = useAuth();

  return (
    <nav className="navbar navbar-dark bg-dark px-3">
      <Link className="navbar-brand" to="/">CashLy</Link>
      <div>
        <Link className="btn btn-sm btn-outline-light me-2" to="/accounts">
          Accounts
        </Link>
        <button className="btn btn-sm btn-danger" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
