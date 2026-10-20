import { useState, memo } from 'react';
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
  // Moon,
  // Sun,
  Activity,
  BarChart3,
  Inbox,
  Sparkles,
  Bot,
  UsersRound,
  Globe,
  Star,
  LifeBuoy,
  ChevronDown,
  Wrench,
  TrendingUp,
  Brain,
  Cog,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClock } from '@/contexts/ClockContext';
import { useUiActions, useUiState } from '@/common/state/ui-context';
import ConfirmModal from '@/components/ConfirmModal';
import servixLogo from '@/assets/servix-logo.png';
import { useAccess } from '@/hooks/permissions/use-access';

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  /** key on the useAccess return value that gates this item; undefined = always visible */
  accessKey?: keyof ReturnType<typeof useAccess>;
};

type NavGroup = {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
};

type NavEntry = NavItem | NavGroup;

const isNavGroup = (entry: NavEntry): entry is NavGroup => 'items' in entry;

const navEntries: NavEntry[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    id: 'operations',
    label: 'Operations',
    icon: Wrench,
    items: [
      { label: 'Clients', href: '/clients', icon: Users, accessKey: 'canViewClients' },
      { label: 'Requests', href: '/requests', icon: Inbox, accessKey: 'canViewRequests' },
      { label: 'Jobs', href: '/jobs', icon: Briefcase, accessKey: 'canViewJobs' },
      { label: 'Invoices', href: '/invoices', icon: FileText, accessKey: 'canViewInvoices' },
      { label: 'Payments', href: '/payments', icon: CreditCard, accessKey: 'canViewPayments' },
    ],
  },
  {
    id: 'team',
    label: 'Team',
    icon: UsersRound,
    items: [
      { label: 'Teams', href: '/teams', icon: UsersRound },
      { label: 'Roles', href: '/roles', icon: ShieldCheck, accessKey: 'canViewRoles' },
    ],
  },
  {
    id: 'growth',
    label: 'Growth',
    icon: TrendingUp,
    items: [
      { label: 'My Website', href: '/my-website', icon: Globe, accessKey: 'canViewMyWebsite' },
      { label: 'Reviews', href: '/reviews', icon: Star, accessKey: 'canViewReviews' },
    ],
  },
  {
    id: 'intelligence',
    label: 'Insights & AI',
    icon: Brain,
    items: [
      { label: 'Analytics', href: '/analytics', icon: BarChart3, accessKey: 'canViewAnalytics' },
      { label: 'AI Insights', href: '/ai-insights', icon: Sparkles, accessKey: 'canViewAiInsights' },
      { label: 'AI Advisor', href: '/ai-advisor', icon: Bot, accessKey: 'canViewAiAdvisor' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    icon: Cog,
    items: [
      { label: 'Activity Logs', href: '/activity-logs', icon: Activity, accessKey: 'canViewActivityLogs' },
      { label: 'Settings', href: '/settings', icon: Settings, accessKey: 'canViewSettings' },
      { label: 'Support', href: '/support', icon: LifeBuoy },
    ],
  },
];

const matchesPath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(href + '/');

type SidebarNavProps = {
  entries: NavEntry[];
  pathname: string;
  onNavigate?: () => void;
};

const SidebarNav = ({ entries, pathname, onNavigate }: SidebarNavProps) => {
  // Highlight the clicked item immediately instead of waiting for the route transition;
  // ignored once the pathname changes, so no effect is needed to clear it.
  const [pending, setPending] = useState<{ href: string; fromPath: string } | null>(null);
  // Only explicit user toggles are stored; groups default to open when they hold the active item.
  const [toggledGroups, setToggledGroups] = useState<Record<string, boolean>>({});

  const isActive = (href: string) =>
    pending && pending.fromPath === pathname ? pending.href === href : matchesPath(pathname, href);

  const handleNavigate = (href: string) => {
    setPending({ href, fromPath: pathname });
    onNavigate?.();
  };

  const renderLink = (item: NavItem, nested: boolean) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => handleNavigate(item.href)}
        aria-current={active ? 'page' : undefined}
        className={`relative flex items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
          nested ? 'py-2' : 'py-2.5'
        } ${
          active
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        {active && nested && (
          <span className='absolute -left-[13px] top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary' />
        )}
        <item.icon size={nested ? 16 : 18} />
        {item.label}
      </Link>
    );
  };

  return (
    <nav className='flex-1 space-y-1 overflow-y-auto px-3 py-4'>
      {entries.map((entry) => {
        if (!isNavGroup(entry)) return renderLink(entry, false);

        const containsActive = entry.items.some((item) => isActive(item.href));
        const isOpen = toggledGroups[entry.id] ?? containsActive;
        return (
          <div key={entry.id}>
            <button
              type='button'
              aria-expanded={isOpen}
              onClick={() => setToggledGroups((prev) => ({ ...prev, [entry.id]: !isOpen }))}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted ${
                containsActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <entry.icon size={18} className={containsActive ? 'text-primary' : undefined} />
              <span className='flex-1 text-left'>{entry.label}</span>
              {containsActive && !isOpen && <span className='h-1.5 w-1.5 rounded-full bg-primary' />}
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className='overflow-hidden'
                >
                  <div className='ml-[21px] mt-1 space-y-0.5 border-l border-border pl-3'>
                    {entry.items.map((item) => renderLink(item, true))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
};

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
  const access = useAccess();

  // Hide gated items until access has resolved, so plan/permission-restricted
  // items (e.g. AI Advisor) never flash into view before being hidden.
  const isItemVisible = (item: NavItem) => {
    if (!item.accessKey) return true;
    if (access.isResolving) return false;
    return !!access[item.accessKey];
  };
  const visibleNavEntries = navEntries.flatMap<NavEntry>((entry) => {
    if (!isNavGroup(entry)) return isItemVisible(entry) ? [entry] : [];
    const items = entry.items.filter(isItemVisible);
    return items.length > 0 ? [{ ...entry, items }] : [];
  });
  const [showClockWarning, setShowClockWarning] = useState(false);

  // Light mode disabled — app is dark-only (forced in AppProviders).
  // const [dark, setDark] = useState(false);
  // useEffect(() => {
  //   const stored = localStorage.getItem('theme');
  //   if (
  //     stored === 'dark' ||
  //     (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)
  //   ) {
  //     setDark(true);
  //     document.documentElement.classList.add('dark');
  //   }
  // }, []);

  // const toggleTheme = () => {
  //   setDark((prev) => {
  //     const next = !prev;
  //     document.documentElement.classList.toggle('dark', next);
  //     localStorage.setItem('theme', next ? 'dark' : 'light');
  //     return next;
  //   });
  // };

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
          <SidebarNav entries={visibleNavEntries} pathname={pathname} />
          <div className='space-y-1 border-t border-border px-3 py-4'>
            {/* Light mode disabled — app is dark-only.
            <button
              onClick={toggleTheme}
              className='flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
              {dark ? 'Light Mode' : 'Dark Mode'}
            </button> */}
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
                <SidebarNav
                  entries={visibleNavEntries}
                  pathname={pathname}
                  onNavigate={() => setMobileSidebarOpen(false)}
                />
                <div className='space-y-1 border-t border-border px-3 py-4'>
                  {/* Light mode disabled — app is dark-only.
                  <button
                    onClick={toggleTheme}
                    className='flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                  >
                    {dark ? <Sun size={18} /> : <Moon size={18} />}{' '}
                    {dark ? 'Light Mode' : 'Dark Mode'}
                  </button> */}
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
