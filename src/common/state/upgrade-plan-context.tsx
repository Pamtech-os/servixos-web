'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import UpgradePlanModal, { type UpgradePlanModalProps } from '@/components/UpgradePlanModal';

type UpgradeModalOptions = Omit<UpgradePlanModalProps, 'open' | 'onOpenChange'>;

type UpgradePlanContextType = {
  showUpgradeModal: (options?: UpgradeModalOptions) => void;
  closeUpgradeModal: () => void;
};

const UpgradePlanContext = createContext<UpgradePlanContextType | null>(null);

export function UpgradePlanProvider({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<UpgradeModalOptions>({});

  const showUpgradeModal = useCallback((opts: UpgradeModalOptions = {}) => {
    setOptions(opts);
    setOpen(true);
  }, []);

  const closeUpgradeModal = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ showUpgradeModal, closeUpgradeModal }),
    [showUpgradeModal, closeUpgradeModal]
  );

  return (
    <UpgradePlanContext.Provider value={value}>
      {children}
      <UpgradePlanModal
        open={open}
        onOpenChange={setOpen}
        {...options}
        onUpgrade={() => {
          options.onUpgrade?.();
        }}
        onLater={() => {
          options.onLater?.();
        }}
      />
    </UpgradePlanContext.Provider>
  );
}

export function useUpgradePlan() {
  const context = useContext(UpgradePlanContext);
  if (!context) {
    throw new Error('useUpgradePlan must be used within UpgradePlanProvider');
  }
  return context;
}
