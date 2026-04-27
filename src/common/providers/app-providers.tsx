'use client';

import type { PropsWithChildren } from 'react';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ClockProvider } from '@/contexts/ClockContext';
import { UiProvider } from '@/common/state/ui-context';
import { UpgradePlanProvider } from '@/common/state/upgrade-plan-context';
import { AppQueryProvider } from '@/common/providers/query-provider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
      <AppQueryProvider>
        <TooltipProvider>
          <AuthProvider>
            <ClockProvider>
              <UiProvider>
                <UpgradePlanProvider>
                  {children}
                </UpgradePlanProvider>
                <Toaster richColors closeButton />
              </UiProvider>
            </ClockProvider>
          </AuthProvider>
        </TooltipProvider>
      </AppQueryProvider>
    </ThemeProvider>
  );
}
