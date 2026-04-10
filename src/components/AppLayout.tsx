import { Navigate, Outlet, useLocation } from 'react-router-dom';
import AppSidebar from '@/components/AppSidebar';
import AppHeader from '@/components/AppHeader';
import AISuggestionsPanel from '@/components/AISuggestionsPanel';
import NewBusinessBanner from '@/components/NewBusinessBanner';
import { useAuth } from '@/contexts/AuthContext';

const AppLayout = () => {
  const { auth } = useAuth();
  const location = useLocation();
  const isAIAdvisorRoute = location.pathname === '/ai-advisor';

  if (!auth.isLoggedIn) return <Navigate to='/login' replace />;
  if (!auth.isPinVerified) return <Navigate to='/pin' replace />;

  return (
    <div
      className={
        isAIAdvisorRoute ? 'h-dvh overflow-hidden bg-background' : 'min-h-screen bg-background'
      }
    >
      <AppSidebar />
      <div className='md:ml-60'>
        {isAIAdvisorRoute ? (
          <div className='flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden pt-14 md:h-dvh md:pt-0'>
            <AppHeader />
            <NewBusinessBanner />
            <main className='flex-1 overflow-hidden'>
              <div className='container mx-auto h-full min-h-0 p-4 md:p-6 lg:p-8'>
                <Outlet />
              </div>
            </main>
          </div>
        ) : (
          <div className='pt-14 md:pt-0'>
            <AppHeader />
            <NewBusinessBanner />
            <main>
              <div className='container mx-auto p-4 md:p-6 lg:p-8'>
                <Outlet />
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
