import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  adminLogout: () => void;
  checkAdminStatus: () => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

// Admin credentials - in production, these should be env variables or more secure
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '2e2W#0GMxZ*S';
const ADMIN_SESSION_KEY = 'bodybeat-admin-session';

export const AdminAuthProvider = ({ children }: AdminAuthProviderProps) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Check for existing admin session on mount
  useEffect(() => {
    const adminSession = localStorage.getItem(ADMIN_SESSION_KEY);
    if (adminSession) {
      try {
        const sessionData = JSON.parse(adminSession);
        // Check if session is still valid (24 hours)
        const now = Date.now();
        if (sessionData.timestamp && (now - sessionData.timestamp) < 24 * 60 * 60 * 1000) {
          setIsAdminAuthenticated(true);
        } else {
          // Session expired, remove it
          localStorage.removeItem(ADMIN_SESSION_KEY);
        }
      } catch (error) {
        // Invalid session data, remove it
        localStorage.removeItem(ADMIN_SESSION_KEY);
      }
    }
  }, []);

  const adminLogin = async (username: string, password: string): Promise<boolean> => {
    // Simple credential check - in production, this should be more secure
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      
      // Store admin session with timestamp
      const sessionData = {
        authenticated: true,
        timestamp: Date.now(),
        username: ADMIN_USERNAME
      };
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionData));
      
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem(ADMIN_SESSION_KEY);
  };

  const checkAdminStatus = () => {
    return isAdminAuthenticated;
  };

  return (
    <AdminAuthContext.Provider value={{
      isAdminAuthenticated,
      adminLogin,
      adminLogout,
      checkAdminStatus
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};