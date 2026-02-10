import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { apiPost, getToken, setToken, clearToken } from '@/lib/api';

export interface AppUser {
  id: string;
  email: string;
}

export interface AppProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: AppUser | null;
  profile: AppProfile | null;
  session: { access_token: string } | null;
  isLoading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwtPayload(token: string): { sub?: string; email?: string; name?: string } {
  try {
    const base64 = token.split('.')[1];
    if (!base64) return {};
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as { sub?: string; email?: string; name?: string };
  } catch {
    return {};
  }
}

function profileFromToken(token: string): AppProfile | null {
  const payload = parseJwtPayload(token);
  if (!payload.sub) return null;
  return {
    id: payload.sub,
    user_id: payload.sub,
    name: payload.name ?? payload.email ?? 'User',
    email: payload.email ?? '',
    avatar_url: null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyToken = (token: string | null) => {
    if (!token) {
      setUser(null);
      setProfile(null);
      setSession(null);
      return;
    }
    setToken(token);
    const payload = parseJwtPayload(token);
    if (payload.sub) {
      setUser({ id: payload.sub, email: payload.email ?? '' });
      setProfile(profileFromToken(token));
      setSession({ access_token: token });
    }
  };

  const refreshProfile = async () => {
    const token = getToken();
    if (token) setProfile(profileFromToken(token));
  };

  useEffect(() => {
    const token = getToken();
    if (token) {
      const payload = parseJwtPayload(token);
      if (payload.sub) {
        setUser({ id: payload.sub, email: payload.email ?? '' });
        setProfile(profileFromToken(token));
        setSession({ access_token: token });
      } else {
        clearToken();
      }
    }
    setIsLoading(false);
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const data = await apiPost<AuthResponse>('/api/auth/register', { email, password, name }, true);
      applyToken(data.token);
      setProfile({ id: data.userId, user_id: data.userId, name: data.name, email: data.email, avatar_url: null });
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error('Registration failed') };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await apiPost<AuthResponse>('/api/auth/login', { email, password }, true);
      applyToken(data.token);
      setProfile({ id: data.userId, user_id: data.userId, name: data.name, email: data.email, avatar_url: null });
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error('Invalid email or password') };
    }
  };

  const signOut = async () => {
    clearToken();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        signUp,
        signIn,
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
