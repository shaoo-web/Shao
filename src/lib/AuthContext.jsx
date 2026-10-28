import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase.js';
import { getProfile } from './api.js';

const AuthContext = createContext({
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch or refresh profile record
  async function fetchUserProfile(userId) {
    if (!userId) {
      setProfile(null);
      return null;
    }
    try {
      const data = await getProfile(userId);
      setProfile(data);
      return data;
    } catch (err) {
      console.warn('Could not load user profile:', err);
      setProfile(null);
      return null;
    }
  }

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user && mounted) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        } else if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.warn('Supabase auth session error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initializeAuth();

    // Listen to Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data?.user) {
      setUser(data.user);
      await fetchUserProfile(data.user.id);
    }
    return data;
  }

  async function signUp({ email, password, fullName = '' }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
    if (data?.user) {
      setUser(data.user);
      await fetchUserProfile(data.user.id);
    }
    return data;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    if (error) throw error;
  }

  async function refreshProfile() {
    if (user?.id) {
      return await fetchUserProfile(user.id);
    }
    return null;
  }

  const isAdmin = Boolean(profile?.is_admin);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
