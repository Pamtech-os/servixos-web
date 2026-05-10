import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';
import AppHeader from '@/components/AppHeader';
import AISuggestionsPanel from '@/components/AISuggestionsPanel';
import NewBusinessBanner from '@/components/NewBusinessBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useUiState } from '@/common/state/ui-context';
import { cn } from '@/lib/utils';

const AppLayout = ({ children }: PropsWithChildren) => {
  const { auth, isHydrated } = useAuth();
  const { isAiSuggestionsOpen } = useUiState();
  const pathname = usePathname();
  const router = useRouter();
  const isAIAdvisorRoute = pathname === '/ai-advisor';
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    if (!auth.isLoggedIn) {
      router.replace('/login');
      return;
    }
    if (auth.user?.mustChangePassword) {
      router.replace('/complete-setup');
      return;
    }
    if (!auth.isPinVerified) {
      router.replace('/pin');
    }
  }, [auth.isLoggedIn, auth.isPinVerified, auth.user?.mustChangePassword, isHydrated, router]);

  useEffect(() => {
    setIsRouteLoading(false);
  }, [pathname]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const link = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!link) return;
      if (link.target && link.target !== '_self') return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin) return;

      const nextPath = `${destination.pathname}${destination.search}${destination.hash}`;
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextPath === currentPath) return;

      setIsRouteLoading(true);
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, []);

  useEffect(() => {
    if (!isRouteLoading) return;
    const timeout = window.setTimeout(() => setIsRouteLoading(false), 10000);
    return () => window.clearTimeout(timeout);
  }, [isRouteLoading]);

  if (!isHydrated || !auth.isLoggedIn || !auth.isPinVerified || auth.user?.mustChangePassword) {
    return null;
  }

  return (
    <div
      className={
        isAIAdvisorRoute ? 'h-dvh overflow-hidden bg-background' : 'min-h-screen bg-background'
      }
    >
      <div
        aria-hidden='true'
        className={`pointer-events-none fixed left-0 right-0 top-0 z-[90] h-1 overflow-hidden transition-opacity duration-200 ${
          isRouteLoading ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className='route-progress-indicator h-full w-1/3 bg-gradient-to-r from-primary via-secondary to-accent' />
      </div>
      <AppSidebar />
      <div className='md:ml-60'>
        {isAIAdvisorRoute ? (
          <div className='flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden pt-14 md:h-dvh md:pt-0'>
            <AppHeader />
            <NewBusinessBanner />
            <main className='flex-1 overflow-hidden'>
              <div
                className={cn(
                  'mx-auto h-full min-h-0 w-full max-w-7xl p-3 sm:p-4 md:p-6 lg:p-8',
                  isAiSuggestionsOpen && 'xl:pr-[420px] 2xl:pr-[440px]'
                )}
              >
                {children}
              </div>
            </main>
          </div>
        ) : (
          <div className='pt-14 md:pt-0'>
            <AppHeader />
            <NewBusinessBanner />
            <main>
              <div
                className={cn(
                  'mx-auto w-full max-w-7xl p-3 sm:p-4 md:p-6 lg:p-8',
                  isAiSuggestionsOpen && 'xl:pr-[420px] 2xl:pr-[440px]'
                )}
              >
                {children}
              </div>
            </main>
          </div>
        )}
      </div>
      <AISuggestionsPanel />
    </div>
  );
};

export default AppLayout;
