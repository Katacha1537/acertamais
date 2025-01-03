'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UpdateContextType {
  triggerUpdate: () => void;
  updateFlag: boolean;
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export const UpdateProvider: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  const [updateFlag, setUpdateFlag] = useState(false);

  const triggerUpdate = () => {
    setUpdateFlag((prev) => !prev); // Alterna o estado para forçar o rerender
  };

  return (
    <UpdateContext.Provider value={{ triggerUpdate, updateFlag }}>
      {children}
    </UpdateContext.Provider>
  );
};

export const useUpdateContext = () => {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useUpdateContext must be used within an UpdateProvider');
  }
  return context;
};
