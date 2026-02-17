import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase.client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1️⃣ Cargar sesión inicial (refresh automático de Supabase)
    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
      }

      const session = data?.session ?? null;

      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      setLoading(false);
    };

    loadSession();

    // 2️⃣ Escuchar cambios de auth (login, logout, refresh)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setToken(session?.access_token ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 3️⃣ Login con Google
  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google'
      // redirectTo: 'http://localhost:5173' // opcional
    });

    if (error) {
      console.error('Google login error:', error);
    }
  };

  // 4️⃣ Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,            // 👈 ESTE es el que usa el backend
        loading,
        isAuthenticated: !!user,
        loginWithGoogle,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook seguro
// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }

  return context; 
}
