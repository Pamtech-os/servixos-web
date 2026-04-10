import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import { ClockProvider } from '@/contexts/ClockContext';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import PinEntry from '@/pages/PinEntry';
import ForgotPassword from '@/pages/ForgotPassword';
import Dashboard from '@/pages/Dashboard';
import Clients from '@/pages/Clients';
import ClientDetail from '@/pages/ClientDetail';
import Roles from '@/pages/Roles';
import Payments from '@/pages/Payments';
import ActivityLogs from '@/pages/ActivityLogs';
import Invoices from '@/pages/Invoices';
import Jobs from '@/pages/Jobs';
import Settings from '@/pages/Settings';
import Analytics from '@/pages/Analytics';
import Requests from '@/pages/Requests';
import AIInsights from '@/pages/AIInsights';
import AIAdvisor from '@/pages/AIAdvisor';
import Teams from '@/pages/Teams';
import ClockHistory from '@/pages/ClockHistory';
import MyWebsite from '@/pages/MyWebsite';
import AppLayout from '@/components/AppLayout';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <ClockProvider>
            <Routes>
              <Route path='/login' element={<Login />} />
              <Route path='/signup' element={<Signup />} />
              <Route path='/pin' element={<PinEntry />} />
              <Route path='/forgot-password' element={<ForgotPassword />} />
              <Route element={<AppLayout />}>
                <Route path='/dashboard' element={<Dashboard />} />
                <Route path='/clients' element={<Clients />} />
                <Route path='/clients/:id' element={<ClientDetail />} />
                <Route path='/invoices' element={<Invoices />} />
                <Route path='/jobs' element={<Jobs />} />
                <Route path='/roles' element={<Roles />} />
                <Route path='/payments' element={<Payments />} />
                <Route path='/activity-logs' element={<ActivityLogs />} />
                <Route path='/analytics' element={<Analytics />} />
                <Route path='/requests' element={<Requests />} />
                <Route path='/ai-insights' element={<AIInsights />} />
                <Route path='/ai-advisor' element={<AIAdvisor />} />
                <Route path='/settings' element={<Settings />} />
                <Route path='/teams' element={<Teams />} />
                <Route path='/teams/clock-history/:employeeId' element={<ClockHistory />} />
                <Route path='/my-website' element={<MyWebsite />} />
              </Route>
              <Route path='/' element={<Navigate to='/login' replace />} />
              <Route path='*' element={<NotFound />} />
            </Routes>
          </ClockProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
