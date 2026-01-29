import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import '../../assets/css/login.css';
import cashlyLogo from '../../assets/Logo.png';


function Login() {
  const { loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Error en el login:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container min-vh-100 d-flex justify-content-center align-items-center">
      {/* Formas decorativas */}
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>

      {/* Card */}
      <div className={`login-card card p-4 p-md-5 shadow-lg ${mounted ? 'fade-in' : ''}`}>
        
        {/* LOGO */}
        <div className="logo-container text-center mb-4">
          <img
            src={cashlyLogo}
            alt="Cashly logo"
            className="cashly-logo mb-3"
          />
          <p className="app-subtitle text-muted mt-2">
            Controla tu dinero de forma inteligente
          </p>
        </div>

        <div className="login-content">
          {/* Beneficios */}
          <div className="benefits-list mb-4">
            <div className="benefit-item d-flex align-items-center mb-3">
              <div className="benefit-icon me-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 12L11 14L15 10M12 3C16.4183 3 20 6.58172 20 11C20 15.4183 16.4183 19 12 19C7.58172 19 4 15.4183 4 11C4 6.58172 7.58172 3 12 3Z"
                    stroke="#4CAF50"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span>Gestión automática de gastos</span>
            </div>

            <div className="benefit-item d-flex align-items-center mb-3">
              <div className="benefit-icon me-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2V6M12 18V22M6 12H2M22 12H18"
                    stroke="#2196F3"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span>Análisis de tendencias financieras</span>
            </div>

            <div className="benefit-item d-flex align-items-center">
              <div className="benefit-icon me-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 12L12 5L21 12V19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19V12Z"
                    stroke="#FF9800"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span>Objetivos de ahorro personalizados</span>
            </div>
          </div>

          {/* Divider */}
          <div className="divider mb-4">
            <span className="divider-text">Comienza ahora</span>
          </div>

          {/* Botón Google */}
          <button
            className={`login-button btn w-100 py-3 d-flex align-items-center justify-content-center ${
              isLoading ? 'loading' : ''
            }`}
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Iniciando sesión...
              </>
            ) : (
              <>
                <svg
                  className="google-icon me-3"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Iniciar sesión con Google
              </>
            )}
          </button>

          {/* Seguridad */}
          <div className="security-note text-center mt-4">
            <small className="text-muted">
              🔒 Tus datos están seguros con cifrado de última generación
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;