import { useState, useEffect, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  ShieldCheck,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Activity,
  BarChart3,
  Inbox,
  Sparkles,
  Bot,
  UsersRound,
  Globe,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClock } from '@/contexts/ClockContext';
import ConfirmModal from '@/components/ConfirmModal';
import servixLogo from '@/assets/servix-logo.png';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Teams', href: '/teams', icon: UsersRound },
  { label: 'Jobs', href: '/jobs', icon: Briefcase },
  { label: 'Invoices', href: '/invoices', icon: FileText },
  { label: 'Roles', href: '/roles', icon: ShieldCheck },
  { label: 'Payments', href: '/payments', icon: CreditCard },
  { label: 'Requests', href: '/requests', icon: Inbox },
  { label: 'My Website', href: '/my-website', icon: Globe },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'AI Insights', href: '/ai-insights', icon: Sparkles },
  { label: 'AI Advisor', href: '/ai-advisor', icon: Bot },
  { label: 'Activity Logs', href: '/activity-logs', icon: Activity },
  { label: 'Settings', href: '/settings', icon: Settings },
];

// Extracted as a stable component so the logo img element never unmounts
const SidebarLogo = memo(() => (
  <div className='flex items-center gap-2 px-4 py-5'>
    <img src={servixLogo} alt='Servix OS' className='h-8 w-8' />
    <span className='font-display text-lg font-bold'>Servix OS</span>
  </div>
));
SidebarLogo.displayName = 'SidebarLogo';

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { status } = useClock();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [showClockWarning, setShowClockWarning] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (
      stored === 'dark' ||
      (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      setDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const handleLogout = () => {
    if (status !== 'clocked_out') {
      setShowClockWarning(true);
      return;
    }
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className='fixed left-0 top-0 z-40 hidden h-screen w-60 border-r border-border bg-card md:block'>
        <div className='flex h-full flex-col'>
          <SidebarLogo />
          <nav className='flex-1 space-y-1 overflow-y-auto px-3 py-4'>
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className='space-y-1 border-t border-border px-3 py-4'>
            <button
              onClick={toggleTheme}
              className='flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
              {dark ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button
              onClick={handleLogout}
              className='flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-destructive/10'
            >
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className='fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden'>
        <SidebarLogo />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className='rounded-lg p-2 text-foreground'
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 z-50 bg-background/60 backdrop-blur-sm md:hidden'
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className='fixed left-0 top-0 z-50 h-screen w-60 border-r border-border bg-card md:hidden'
            >
              <div className='flex h-full flex-col'>
                <SidebarLogo />
                <nav className='flex-1 space-y-1 overflow-y-auto px-3 py-4'>
                  {navItems.map((item) => {
                    const isActive =
                      location.pathname === item.href ||
                      location.pathname.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <item.icon size={18} /> {item.label}
                      </Link>
                    );
                  })}
                </nav>
                <div className='space-y-1 border-t border-border px-3 py-4'>
                  <button
                    onClick={toggleTheme}
                    className='flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                  >
                    {dark ? <Sun size={18} /> : <Moon size={18} />}{' '}
                    {dark ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  <button
                    onClick={handleLogout}
                    className='flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-destructive/10'
                  >
                    <LogOut size={18} /> Sign Out
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={showClockWarning}
        onOpenChange={setShowClockWarning}
        title="You're still clocked in!"
        description='Please clock out before signing out of the application.'
        confirmLabel='OK'
        cancelLabel='Cancel'
        variant='default'
        onConfirm={() => setShowClockWarning(false)}
      />
    </>
  );
};

export default AppSidebar;
