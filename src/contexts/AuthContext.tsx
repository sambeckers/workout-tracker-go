import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: { name?: string; username?: string }) => Promise<{ error?: any; data?: any }>;
  signIn: (emailOrUsername: string, password: string, keepSignedIn?: boolean) => Promise<{ error?: any }>;
  signInWithProvider: (provider: 'google' | 'apple' | 'github' | 'discord') => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: any }>;
  changePassword: (password: string) => Promise<{ error?: any }>;
  updateProfile: (updates: { name?: string; username?: string; avatar_url?: string }) => Promise<{ error?: any }>;
  resendConfirmation: (email: string) => Promise<{ error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata?: { name?: string; username?: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { data, error };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (emailOrUsername: string, password: string, keepSignedIn?: boolean) => {
    try {
      let email = emailOrUsername;
      
      // Check if input looks like an email (contains @)
      if (!emailOrUsername.includes('@')) {
        // It's a username, try to look up the email
        try {
          const { data, error: lookupError } = await supabase.rpc('get_email_by_username', {
            username_input: emailOrUsername
          });
          
          if (lookupError) {
            console.error('Username lookup error:', lookupError);
            return { error: { message: 'Username lookup failed' } };
          }
          
          if (!data) {
            return { error: { message: 'Username not found' } };
          }
          
          email = data;
        } catch (lookupError) {
          console.error('Username lookup failed:', lookupError);
          return { error: { message: 'Username lookup failed' } };
        }
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // If keepSignedIn is true, update the session to not expire
      if (!error && keepSignedIn) {
        await supabase.auth.updateUser({
          data: { keep_signed_in: true }
        });
      }
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signInWithProvider = async (provider: 'google' | 'apple' | 'github' | 'discord') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const updateProfile = async (updates: { name?: string; username?: string; avatar_url?: string }) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: updates,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const changePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    resetPassword,
    changePassword,
    updateProfile,
    resendConfirmation,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
