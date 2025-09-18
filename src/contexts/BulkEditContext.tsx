import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

interface BulkEditContextType {
  isBulkEditMode: boolean;
  setIsBulkEditMode: (value: boolean) => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  onSaveBulkEdit?: () => void;
  onDiscardBulkEdit?: () => void;
  onResetChanges?: () => void;
  setBulkEditActions: (save: () => void, discard: () => void, reset?: () => void) => void;
}

const BulkEditContext = createContext<BulkEditContextType | undefined>(undefined);

export const useBulkEdit = () => {
  const context = useContext(BulkEditContext);
  if (!context) {
    throw new Error('useBulkEdit must be used within a BulkEditProvider');
  }
  return context;
};

interface BulkEditProviderProps {
  children: ReactNode;
}

export const BulkEditProvider: React.FC<BulkEditProviderProps> = ({ children }) => {
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [onSaveBulkEdit, setOnSaveBulkEdit] = useState<(() => void) | undefined>();
  const [onDiscardBulkEdit, setOnDiscardBulkEdit] = useState<(() => void) | undefined>();
  const [onResetChanges, setOnResetChanges] = useState<(() => void) | undefined>();

  // Memoize all setter functions to prevent infinite re-renders
  const memoizedSetIsBulkEditMode = useCallback((value: boolean) => {
    setIsBulkEditMode(value);
  }, []);

  const memoizedSetHasUnsavedChanges = useCallback((value: boolean) => {
    setHasUnsavedChanges(value);
  }, []);

  const setBulkEditActions = useCallback((save: () => void, discard: () => void, reset?: () => void) => {
    setOnSaveBulkEdit(() => save);
    setOnDiscardBulkEdit(() => discard);
    setOnResetChanges(reset ? () => reset : undefined);
  }, []);

  const value: BulkEditContextType = useMemo(() => ({
    isBulkEditMode,
    setIsBulkEditMode: memoizedSetIsBulkEditMode,
    hasUnsavedChanges,
    setHasUnsavedChanges: memoizedSetHasUnsavedChanges,
    onSaveBulkEdit,
    onDiscardBulkEdit,
    onResetChanges,
    setBulkEditActions,
  }), [
    isBulkEditMode,
    memoizedSetIsBulkEditMode,
    hasUnsavedChanges,
    memoizedSetHasUnsavedChanges,
    onSaveBulkEdit,
    onDiscardBulkEdit,
    onResetChanges,
    setBulkEditActions,
  ]);

  return (
    <BulkEditContext.Provider value={value}>
      {children}
    </BulkEditContext.Provider>
  );
};
