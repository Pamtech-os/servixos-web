'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Users,
  FileText,
  Star,
  TrendingUp,
  Briefcase,
  Clock,
  CreditCard,
  UserPlus,
  Settings,
  ShieldCheck,
  UserCog,
  CheckSquare,
  Globe,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const RevenueChart = dynamic(() => import('@/components/charts/RevenueChart'), { ssr: false });
const JobsStatusChart = dynamic(() => import('@/components/charts/JobsStatusChart'), { ssr: false });
import {
  useAnalyticsDashboard,
  useAnalyticsRevenue,
  useAnalyticsJobs,
} from '@/hooks/queries/use-analytics';
import type { ActivityLogCategory } from '@/lib/api-client';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  completed: '#22c55e',
  cancelled: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const ACTIVITY_ICONS: Record<ActivityLogCategory, typeof Clock> = {
  invoice: FileText,
  client: UserPlus,
  job: Briefcase,
  payment: CreditCard,
  auth: ShieldCheck,
  settings: Settings,
  role: ShieldCheck,
  employee: UserCog,
  task: CheckSquare,
  request: FileText,
  website: Globe,
};

function formatMonth(monthKey: string): string {
  const [, month] = monthKey.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[parseInt(month, 10) - 1];
}

function formatRelativeTime(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const Dashboard = () => {
  const { data: dashboardData, isPending: dashboardPending } = useAnalyticsDashboard();
  const { data: revenueData, isPending: revenuePending } = useAnalyticsRevenue(7);
  const { data: jobsData, isPending: jobsPending } = useAnalyticsJobs();

  const revenueChartData = (revenueData ?? []).map((d) => ({
    month: formatMonth(d.month),
    revenue: d.revenue,
  }));

  const jobsChartData = (jobsData ?? [])
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: STATUS_LABELS[d.status] ?? d.status,
      value: d.count,
      fill: STATUS_COLORS[d.status] ?? '#94a3b8',
    }));

  const hasJobData = (jobsData ?? []).some((d) => d.count > 0);

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='font-display text-2xl font-bold md:text-3xl'>Dashboard</h1>
        <p className='text-sm text-muted-foreground'>
          Welcome back! Here is your business overview.
        </p>
      </div>

      {/* Stat Cards */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {[
          {
            title: 'Monthly Revenue',
            value: dashboardData != null
              ? `$${dashboardData.monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '—',
            sub: 'Current month',
            icon: DollarSign,
            iconGradient: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
          },
          {
            title: 'Active Clients',
            value: dashboardData != null ? dashboardData.activeClientsCount.toLocaleString() : '—',
            sub: 'With open jobs',
            icon: Users,
            iconGradient: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))',
          },
          {
            title: 'Outstanding Invoices',
            value: dashboardData != null ? String(dashboardData.outstandingInvoices.count) : '—',
            sub: dashboardData != null
              ? `$${dashboardData.outstandingInvoices.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} remaining`
              : '',
            icon: FileText,
            iconGradient: 'linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--primary)))',
          },
          {
            title: 'Reviews',
            value: '—',
            sub: 'Coming soon',
            icon: Star,
            iconGradient: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
            muted: true,
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            {dashboardPending ? (
              <Card>
                <CardContent className='p-6'>
                  <Skeleton className='mb-2 h-4 w-24' />
                  <Skeleton className='mb-1 h-8 w-20' />
                  <Skeleton className='h-3 w-16' />
                </CardContent>
              </Card>
            ) : (
              <Card className={stat.muted ? 'overflow-hidden opacity-50' : 'overflow-hidden'}>
                <CardContent className='relative p-6'>
                  <div
                    className='absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground shadow-sm'
                    style={{ background: stat.iconGradient }}
                  >
                    <stat.icon size={20} />
                  </div>
                  <p className='text-sm font-medium text-muted-foreground'>{stat.title}</p>
                  <p className='mt-1 font-display text-2xl font-bold'>{stat.value}</p>
                  <p className='mt-1 text-xs text-muted-foreground'>{stat.sub}</p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Revenue Trend */}
        <motion.div
          className='lg:col-span-2'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <div className='flex w-full items-center justify-between'>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <TrendingUp size={18} className='text-primary' />
                  Revenue Trend
                </CardTitle>
                <span className='text-xs font-medium text-muted-foreground'>Last 7 months</span>
              </div>
            </CardHeader>
            <CardContent>
              {revenuePending ? (
                <Skeleton className='h-64 w-full' />
              ) : (
                <RevenueChart data={revenueChartData} />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Jobs by Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base'>
                <Briefcase size={18} className='text-primary' />
                Jobs by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {jobsPending ? (
                <Skeleton className='mx-auto h-52 w-52 rounded-full' />
              ) : !hasJobData ? (
                <div className='flex h-[260px] flex-col items-center justify-center gap-2 text-center'>
                  <p className='text-sm font-medium text-muted-foreground'>No jobs yet</p>
                  <p className='text-xs text-muted-foreground'>
                    Job status distribution will appear here.
                  </p>
                </div>
              ) : (
                <JobsStatusChart data={jobsChartData} />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base'>
                <Clock size={18} className='text-primary' />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardPending ? (
                <div className='space-y-4'>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className='flex items-start gap-3'>
                      <Skeleton className='h-8 w-8 rounded-lg' />
                      <div className='flex-1 space-y-1'>
                        <Skeleton className='h-4 w-3/4' />
                        <Skeleton className='h-3 w-1/4' />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !dashboardData?.recentActivity.length ? (
                <div className='flex h-40 flex-col items-center justify-center gap-2 text-center'>
                  <p className='text-sm font-medium text-muted-foreground'>No recent activity</p>
                  <p className='text-xs text-muted-foreground'>
                    Actions taken by your team will appear here.
                  </p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {dashboardData.recentActivity.map((activity) => {
                    const Icon = ACTIVITY_ICONS[activity.category] ?? Clock;
                    return (
                      <div key={activity.id} className='flex items-start gap-3'>
                        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted'>
                          <Icon size={14} className='text-muted-foreground' />
                        </div>
                        <div className='min-w-0 flex-1'>
                          <p className='text-sm'>{activity.action}</p>
                          <p className='text-xs text-muted-foreground'>
                            {activity.actorName} · {formatRelativeTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Clients */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <div className='flex w-full items-center justify-between'>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <Users size={18} className='text-primary' />
                  Top Clients
                </CardTitle>
                <Link
                  href='/clients'
                  className='flex items-center gap-1 text-xs text-primary hover:underline'
                >
                  View all <ArrowRight size={12} />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {dashboardPending ? (
                <div className='space-y-4'>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <Skeleton className='h-9 w-9 rounded-full' />
                        <div className='space-y-1'>
                          <Skeleton className='h-4 w-28' />
                          <Skeleton className='h-3 w-20' />
                        </div>
                      </div>
                      <Skeleton className='h-4 w-16' />
                    </div>
                  ))}
                </div>
              ) : !dashboardData?.topClients.length ? (
                <div className='flex h-40 flex-col items-center justify-center gap-2 text-center'>
                  <p className='text-sm font-medium text-muted-foreground'>No client data yet</p>
                  <p className='text-xs text-muted-foreground'>
                    Top clients by spend will appear here.
                  </p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {dashboardData.topClients.map((client) => (
                    <div key={client.clientId} className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='gradient-bg flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-primary-foreground'>
                          {getInitials(client.name)}
                        </div>
                        <div>
                          <p className='text-sm font-medium'>{client.name}</p>
                          <p className='text-xs text-muted-foreground'>{client.email}</p>
                        </div>
                      </div>
                      <span className='font-display text-sm font-semibold'>
                        ${client.totalSpent.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
