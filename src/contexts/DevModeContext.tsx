import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface DevModeContextType {
  isDevMode: boolean;
  toggleDevMode: () => void;
  forceUserMode: () => void;
  forceDevMode: () => void;
}

const DevModeContext = createContext<DevModeContextType | undefined>(undefined);

export const useDevMode = () => {
  const context = useContext(DevModeContext);
  if (!context) {
    throw new Error('useDevMode must be used within a DevModeProvider');
  }
  return context;
};

interface DevModeProviderProps {
  children: ReactNode;
}

export const DevModeProvider = ({ children }: DevModeProviderProps) => {
  const [isDevMode, setIsDevMode] = useState(false);

  // Load dev mode state from localStorage on mount
  useEffect(() => {
    const savedDevMode = localStorage.getItem('bodybeat-dev-mode');
    if (savedDevMode === 'true') {
      setIsDevMode(true);
    }
  }, []);

  // Save dev mode state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bodybeat-dev-mode', isDevMode.toString());
  }, [isDevMode]);

  const toggleDevMode = () => {
    setIsDevMode(!isDevMode);
  };

  const forceUserMode = () => {
    setIsDevMode(false);
  };

  const forceDevMode = () => {
    setIsDevMode(true);
  };

  return (
    <DevModeContext.Provider value={{
      isDevMode,
      toggleDevMode,
      forceUserMode,
      forceDevMode
    }}>
      {children}
    </DevModeContext.Provider>
  );
};