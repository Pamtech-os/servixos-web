import { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
import { useUiActions, useUiState } from '@/common/state/ui-context';
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

type SidebarLogoProps = {
  compact?: boolean;
};

// Extracted as a stable component so the logo img element never unmounts
const SidebarLogo = memo(({ compact = false }: SidebarLogoProps) => (
  <div className={compact ? 'flex items-center gap-2' : 'flex items-center gap-2 px-4 py-5'}>
    <Image
      src={servixLogo}
      alt='Servix OS'
      width={compact ? 28 : 32}
      height={compact ? 28 : 32}
      className={compact ? 'h-7 w-7' : 'h-8 w-8'}
    />
    {compact ? (
      <span className='font-display text-base font-bold max-[380px]:hidden'>Servix OS</span>
    ) : (
      <span className='font-display text-lg font-bold'>Servix OS</span>
    )}
  </div>
));
SidebarLogo.displayName = 'SidebarLogo';

const AppSidebar = () => {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const { logout } = useAuth();
  const { status } = useClock();
  const { isMobileSidebarOpen: mobileOpen } = useUiState();
  const { setMobileSidebarOpen, toggleMobileSidebar } = useUiActions();
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
    router.push('/login');
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
                pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
      <div className='fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-border bg-card px-3 py-2.5 md:hidden'>
        <SidebarLogo compact />
        <button
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={toggleMobileSidebar}
          className='rounded-lg border border-border bg-muted/60 p-1.5 text-foreground shadow-sm'
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
              onClick={() => setMobileSidebarOpen(false)}
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
                      pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileSidebarOpen(false)}
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
