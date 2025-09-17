import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type UnitPreference = 'kg' | 'lbs';

interface UnitPreferenceContextValue {
  unit: UnitPreference;
  setUnit: (u: UnitPreference) => void;
  toggleUnit: () => void;
}

const UnitPreferenceContext = createContext<UnitPreferenceContextValue | undefined>(undefined);

const STORAGE_KEY = 'unit-preference';

export const UnitPreferenceProvider = ({ children }: { children: ReactNode }) => {
  const [unit, setUnitState] = useState<UnitPreference>('kg');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as UnitPreference | null;
    if (stored === 'kg' || stored === 'lbs') {
      setUnitState(stored);
    }
  }, []);

  const setUnit = (u: UnitPreference) => {
    setUnitState(u);
    try { localStorage.setItem(STORAGE_KEY, u); } catch {}
  };

  const toggleUnit = () => setUnit(unit === 'kg' ? 'lbs' : 'kg');

  return (
    <UnitPreferenceContext.Provider value={{ unit, setUnit, toggleUnit }}>
      {children}
    </UnitPreferenceContext.Provider>
  );
};

export const useUnitPreference = () => {
  const ctx = useContext(UnitPreferenceContext);
  if (!ctx) throw new Error('useUnitPreference must be used within UnitPreferenceProvider');
  return ctx;
};
