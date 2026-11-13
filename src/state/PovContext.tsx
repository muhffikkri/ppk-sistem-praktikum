import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Pov = 'praktikan' | 'asisten';

type PovContextValue = {
  pov: Pov;
  setPov: (next: Pov) => void;
};

const PovContext = createContext<PovContextValue | undefined>(undefined);

export function PovProvider({ children }: { children: ReactNode }) {
  const [pov, setPov] = useState<Pov>('praktikan');
  return (
    <PovContext.Provider value={{ pov, setPov }}>
      {children}
    </PovContext.Provider>
  );
}

export function usePov(): PovContextValue {
  const ctx = useContext(PovContext);
  if (!ctx) {
    throw new Error('usePov must be used within a PovProvider');
  }
  return ctx;
}
