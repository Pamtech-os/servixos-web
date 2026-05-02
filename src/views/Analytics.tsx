'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, MousePointerClick, TrendingUp, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const trafficData = [
  { date: 'Mon', visitors: 420, pageViews: 1240 },
  { date: 'Tue', visitors: 380, pageViews: 1100 },
  { date: 'Wed', visitors: 510, pageViews: 1580 },
  { date: 'Thu', visitors: 470, pageViews: 1340 },
  { date: 'Fri', visitors: 600, pageViews: 1820 },
  { date: 'Sat', visitors: 350, pageViews: 980 },
  { date: 'Sun', visitors: 290, pageViews: 860 },
];

const topPages = [
  { page: '/home', views: 4820, percentage: 100 },
  { page: '/services', views: 3240, percentage: 67 },
  { page: '/about', views: 2180, percentage: 45 },
  { page: '/contact', views: 1960, percentage: 41 },
  { page: '/portfolio', views: 1540, percentage: 32 },
  { page: '/blog', views: 1120, percentage: 23 },
  { page: '/pricing', views: 980, percentage: 20 },
];

const statCards = [
  {
    title: 'Total Visitors',
    value: '3,020',
    change: '+14.2%',
    icon: Eye,
    iconGradient: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
  },
  {
    title: 'Page Views',
    value: '8,920',
    change: '+8.7%',
    icon: MousePointerClick,
    iconGradient: 'linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--primary)))',
  },
  {
    title: 'Daily Average',
    value: '431',
    change: '+5.3%',
    icon: TrendingUp,
    iconGradient: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))',
  },
  {
    title: 'Conversion Rate',
    value: '3.2%',
    change: '+0.8%',
    icon: Target,
    iconGradient: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
  },
];

const Analytics = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className='space-y-6'>
      <div>
        <div>
          <h1 className='font-display text-2xl font-bold md:text-3xl'>Analytics</h1>
          <p className='text-sm text-muted-foreground'>
            Track your website performance and traffic.
          </p>
        </div>
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
            {loading ? (
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
                  <p className='mt-1 text-xs text-emerald-500 font-medium'>{stat.change}</p>
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
              {loading ? (
                <Skeleton className='h-72 w-full' />
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
                    <Tooltip
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
              {loading ? (
                <div className='space-y-4'>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className='flex items-center gap-4'>
                      <Skeleton className='h-4 w-24' />
                      <Skeleton className='h-3 flex-1' />
                      <Skeleton className='h-4 w-16' />
                    </div>
                  ))}
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
