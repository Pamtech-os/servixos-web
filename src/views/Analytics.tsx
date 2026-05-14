'use client';

import { motion } from 'framer-motion';
import { Eye, MousePointerClick, TrendingUp, Target, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAnalyticsTraffic } from '@/hooks/queries/use-analytics';

function formatChartDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${monthNames[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;
}

const Analytics = () => {
  const { data, isPending } = useAnalyticsTraffic();

  const stats = data?.stats;
  const trafficData = (data?.trafficData ?? []).map((d) => ({
    ...d,
    date: formatChartDate(d.date),
  }));
  const topPages = data?.topPages ?? [];
  const hasTrafficData = trafficData.some((d) => d.pageViews > 0);

  const statCards = [
    {
      title: 'Total Visitors',
      value: stats != null ? stats.totalVisitors.toLocaleString() : '—',
      icon: Eye,
      iconGradient: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
    },
    {
      title: 'Page Views',
      value: stats != null ? stats.totalPageViews.toLocaleString() : '—',
      icon: MousePointerClick,
      iconGradient: 'linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--primary)))',
    },
    {
      title: 'Daily Average',
      value: stats != null ? Math.round(stats.dailyAverage).toLocaleString() : '—',
      icon: TrendingUp,
      iconGradient: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))',
    },
    {
      title: 'Conversion Rate',
      value: stats != null ? `${stats.conversionRate.toFixed(2)}%` : '—',
      icon: Target,
      iconGradient: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
      tooltip: 'Tracks website-to-request conversions. Shows 0.00% until website traffic tracking is active.',
    },
  ];

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='font-display text-2xl font-bold md:text-3xl'>Analytics</h1>
        <p className='text-sm text-muted-foreground'>
          Track your website performance and traffic.
        </p>
      </div>

      {/* Stat Cards */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            {isPending ? (
              <Card>
                <CardContent className='p-6'>
                  <Skeleton className='mb-2 h-4 w-24' />
                  <Skeleton className='mb-1 h-8 w-20' />
                  <Skeleton className='h-3 w-16' />
                </CardContent>
              </Card>
            ) : (
              <Card className='overflow-hidden'>
                <CardContent className='relative p-6'>
                  <div
                    className='absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground shadow-sm'
                    style={{ background: stat.iconGradient }}
                  >
                    <stat.icon size={20} />
                  </div>
                  <p className='text-sm font-medium text-muted-foreground'>{stat.title}</p>
                  <p className='mt-1 font-display text-2xl font-bold'>{stat.value}</p>
                  {stat.tooltip && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className='mt-1 flex cursor-help items-center gap-1 text-xs text-muted-foreground'>
                          <Info size={11} />
                          Website tracking pending
                        </p>
                      </TooltipTrigger>
                      <TooltipContent className='max-w-64 text-xs'>
                        {stat.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        ))}
      </div>

      {/* Traffic Overview + Top Pages side by side */}
      <div className='grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className='h-full'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base'>
                <TrendingUp size={18} className='text-primary' />
                Traffic Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <Skeleton className='h-72 w-full' />
              ) : !hasTrafficData ? (
                <div className='flex h-72 flex-col items-center justify-center gap-2 text-center'>
                  <p className='text-sm font-medium text-muted-foreground'>No traffic data yet</p>
                  <p className='text-xs text-muted-foreground'>
                    Publish your website to start tracking visitors.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width='100%' height={340}>
                  <AreaChart data={trafficData}>
                    <defs>
                      <linearGradient id='visitorsGrad' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor='hsl(217, 91%, 60%)' stopOpacity={0.3} />
                        <stop offset='95%' stopColor='hsl(217, 91%, 60%)' stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id='pageViewsGrad' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor='hsl(270, 70%, 60%)' stopOpacity={0.3} />
                        <stop offset='95%' stopColor='hsl(270, 70%, 60%)' stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray='3 3'
                      stroke='hsl(220, 13%, 88%)'
                      opacity={0.3}
                    />
                    <XAxis dataKey='date' tick={{ fontSize: 12 }} stroke='hsl(220, 10%, 46%)' />
                    <YAxis tick={{ fontSize: 12 }} stroke='hsl(220, 10%, 46%)' />
                    <ChartTooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    />
                    <Legend iconType='circle' iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                    <Area
                      type='monotone'
                      dataKey='visitors'
                      stroke='hsl(217, 91%, 60%)'
                      fill='url(#visitorsGrad)'
                      strokeWidth={2}
                      name='Visitors'
                    />
                    <Area
                      type='monotone'
                      dataKey='pageViews'
                      stroke='hsl(270, 70%, 60%)'
                      fill='url(#pageViewsGrad)'
                      strokeWidth={2}
                      name='Page Views'
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className='h-full'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base'>
                <MousePointerClick size={18} className='text-primary' />
                Top Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <div className='space-y-4'>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className='flex items-center gap-4'>
                      <Skeleton className='h-4 w-24' />
                      <Skeleton className='h-3 flex-1' />
                      <Skeleton className='h-4 w-16' />
                    </div>
                  ))}
                </div>
              ) : topPages.length === 0 ? (
                <div className='flex h-40 flex-col items-center justify-center gap-2 text-center'>
                  <p className='text-sm font-medium text-muted-foreground'>No page data yet</p>
                  <p className='text-xs text-muted-foreground'>
                    Page view data will appear once your website receives traffic.
                  </p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {topPages.map((page, i) => (
                    <motion.div
                      key={page.page}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                      className='flex items-center gap-3'
                    >
                      <span className='w-20 shrink-0 truncate text-xs font-medium'>
                        {page.page}
                      </span>
                      <div className='flex-1'>
                        <Progress value={page.percentage} className='h-2' />
                      </div>
                      <span className='w-12 text-right text-xs font-semibold tabular-nums text-muted-foreground'>
                        {page.views.toLocaleString()}
                      </span>
                    </motion.div>
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

export default Analytics;
