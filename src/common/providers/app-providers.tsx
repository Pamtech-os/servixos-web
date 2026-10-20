'use client';

import type { PropsWithChildren } from 'react';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { ClockProvider } from '@/contexts/ClockContext';
import { UiProvider } from '@/common/state/ui-context';
import { UpgradePlanProvider } from '@/common/state/upgrade-plan-context';
import { AppQueryProvider } from '@/common/providers/query-provider';
import SubscriptionModals from '@/components/SubscriptionModals';

export function AppProviders({ children }: PropsWithChildren) {
  // Light mode disabled — app is dark-only. Restore to re-enable theme switching:
  // <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
  return (
    <ThemeProvider
      attribute='class'
      forcedTheme='dark'
      defaultTheme='dark'
      enableSystem={false}
      disableTransitionOnChange
    >
      <AppQueryProvider>
        <TooltipProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <ClockProvider>
                <UiProvider>
                  <UpgradePlanProvider>
                    {children}
                    <SubscriptionModals />
                  </UpgradePlanProvider>
                  <Toaster closeButton />
                </UiProvider>
              </ClockProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </TooltipProvider>
      </AppQueryProvider>
    </ThemeProvider>
  );
}
