import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const loadUser = async ({ silent = false } = {}) => {
    if (!silent) setIsLoadingAuth(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const me = await base44.auth.me();
        setUser(me);
        setIsAuthenticated(true);
        setAuthError(null);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({ type: 'auth_required', message: 'Inloggen vereist' });
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'auth_required', message: error.message || 'Inloggen vereist' });
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  useEffect(() => {
    loadUser();
    // Bij latere auth-events (token refresh, focus, in-/uitloggen) stil bijwerken,
    // zonder de hele app naar een laadspinner te laten knipperen.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // Bewaar de Google refresh-token na inloggen, zodat de agenda server-side
      // opgehaald kan blijven worden (Google access-tokens verlopen na ~1 uur).
      if (session?.provider_refresh_token && session.user) {
        supabase
          .from('profiles')
          .update({ google_refresh_token: session.provider_refresh_token })
          .eq('id', session.user.id)
          .then(() => {}, () => {});
      }
      loadUser({ silent: true });
    });
    return () => sub?.subscription?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    base44.auth.logout(shouldRedirect ? window.location.origin : undefined);
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.origin);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      appPublicSettings: null,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth: loadUser,
      checkAppState: loadUser,
      signInWithGoogle: base44.auth.signInWithGoogle,
      signInWithEmail: base44.auth.signInWithEmail,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
