import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../assets/css/Navbar.css';
import cashlyLogo from '../assets/Logo/Logo.png';

const getUserAvatar = (user) => {
  if (!user) return '';

  return (
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    user.identities?.[0]?.identity_data?.avatar_url ||
    user.identities?.[0]?.identity_data?.picture ||
    ''
  );
};

const getUserInitial = (user) => {
  const source =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    'U';

  return source[0]?.toUpperCase() || 'U';
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Cerrar menú al cambiar de ruta
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { path: '/', label: 'Pagina Inicial', icon: '📊' },
    { path: '/accounts', label: 'Cuentas', icon: '🏦' },
    { path: '/transactions', label: 'Transacciones', icon: '💳' },
    { path: '/categories', label: 'Categorías', icon: '🏷️' },
    { path: '/budgets', label: 'Presupuestos', icon: '📊' },
    { path: '/goals', label: 'Metas', icon: '🎯' },
    { path: '/reports', label: 'Reportes', icon: '📈' },
  ];

  const isActive = (path) => location.pathname === path;
  const avatarUrl = getUserAvatar(user);
  const initial = getUserInitial(user);

  return (
    <>
      <nav className="navbar-cashly">
        <div className="navbar-container">
          {/* Logo simple sin fondo */}
          <div className="navbar-logo">
            <Link to="/" className="logo-link">
              <img 
                src={cashlyLogo} 
                alt="CashLy Logo" 
                className="logo-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="logo-fallback" style={{ display: 'none' }}>
                <span>CashLy</span>
              </div>
            </Link>
          </div>

          {/* Foto de perfil en círculo */}
          <div className="navbar-profile">
            <div 
              className="profile-circle"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setIsMenuOpen(!isMenuOpen)}
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={user.email} 
                  className="profile-photo"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="profile-initial">
                  <span>{initial}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Menú lateral (mantenido como estaba) */}
        <div className={`sidebar-menu ${isMenuOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div className="user-info">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={user.email} 
                  className="sidebar-user-photo"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="sidebar-user-fallback">
                  <span>{initial}</span>
                </div>
              )}
              <div className="user-details">
                <h3 className="user-email">{user?.email || 'Usuario'}</h3>
                <span className="user-status">En línea</span>
              </div>
            </div>
            <button 
              className="close-menu"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Cerrar menú"
            >
              ✕
            </button>
          </div>

          <div className="sidebar-nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="sidebar-footer">
            <button 
              className="logout-button" 
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <span className="logout-icon">🚪</span>
              <span className="logout-text">
                {isLoggingOut ? 'Saliendo...' : 'Cerrar sesión'}
              </span>
              {isLoggingOut && <span className="spinner"></span>}
            </button>
          </div>
        </div>

        {/* Overlay para cerrar menú */}
        {isMenuOpen && (
          <div 
            className="menu-overlay" 
            onClick={() => setIsMenuOpen(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setIsMenuOpen(false)}
          />
        )}
      </nav>
    </>
  );
}
