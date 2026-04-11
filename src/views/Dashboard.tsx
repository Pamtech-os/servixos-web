'use client';

import { useState, useEffect } from 'react';
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
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  mockActivities,
  mockClients,
  mockRevenueData,
  mockJobStatusData,
} from '@/lib/mock-data';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const statCards = [
  {
    title: 'Monthly Revenue',
    value: '$19,800',
    change: '+12.5%',
    icon: DollarSign,
    gradient: 'from-primary to-secondary',
  },
  {
    title: 'Active Clients',
    value: '8',
    change: '+2 this month',
    icon: Users,
    gradient: 'from-accent to-primary',
  },
  {
    title: 'Outstanding Invoices',
    value: '4',
    change: '$11,600 total',
    icon: FileText,
    gradient: 'from-secondary to-primary',
  },
  {
    title: 'Reviews',
    value: '4.8',
    change: '32 reviews',
    icon: Star,
    gradient: 'from-primary to-accent',
  },
];

const activityIcons: Record<string, typeof DollarSign> = {
  invoice: FileText,
  client: UserPlus,
  job: Briefcase,
  payment: CreditCard,
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const topClients = [...mockClients].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

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
                    className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} text-primary-foreground`}
                  >
                    <stat.icon size={20} />
                  </div>
                  <p className='text-sm font-medium text-muted-foreground'>{stat.title}</p>
                  <p className='mt-1 font-display text-2xl font-bold'>{stat.value}</p>
                  <p className='mt-1 text-xs text-muted-foreground'>{stat.change}</p>
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
              <div className='flex items-center justify-between w-full'>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <TrendingUp size={18} className='text-primary' />
                  Revenue Trend
                </CardTitle>
                <span className='text-xs text-muted-foreground font-medium'>Last 7 months</span>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className='h-64 w-full' />
              ) : (
                <ResponsiveContainer width='100%' height={260}>
                  <AreaChart data={mockRevenueData}>
                    <defs>
                      <linearGradient id='revenueGrad' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor='hsl(217, 91%, 60%)' stopOpacity={0.3} />
                        <stop offset='95%' stopColor='hsl(217, 91%, 60%)' stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray='3 3'
                      stroke='hsl(220, 13%, 88%)'
                      opacity={0.3}
                    />
                    <XAxis dataKey='month' tick={{ fontSize: 12 }} stroke='hsl(220, 10%, 46%)' />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke='hsl(220, 10%, 46%)'
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                      formatter={(value) => [`$${Number(value ?? 0).toLocaleString()}`, 'Revenue']}
                    />
                    <Area
                      type='monotone'
                      dataKey='revenue'
                      stroke='hsl(217, 91%, 60%)'
                      fill='url(#revenueGrad)'
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
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
              {loading ? (
                <Skeleton className='mx-auto h-52 w-52 rounded-full' />
              ) : (
                <ResponsiveContainer width='100%' height={260}>
                  <PieChart>
                    <Pie
                      data={mockJobStatusData}
                      cx='50%'
                      cy='45%'
                      innerRadius={55}
                      outerRadius={85}
                      dataKey='value'
                      paddingAngle={4}
                      strokeWidth={0}
                    >
                      {mockJobStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend iconType='circle' iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
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
              {loading ? (
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
              ) : (
                <div className='space-y-4'>
                  {mockActivities.map((activity) => {
                    const Icon = activityIcons[activity.type] || Clock;
                    return (
                      <div key={activity.id} className='flex items-start gap-3'>
                        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted'>
                          <Icon size={14} className='text-muted-foreground' />
                        </div>
                        <div className='min-w-0 flex-1'>
                          <p className='text-sm'>{activity.description}</p>
                          <p className='text-xs text-muted-foreground'>{activity.time}</p>
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
              <div className='flex items-center justify-between w-full'>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <Users size={18} className='text-primary' />
                  Top Clients
                </CardTitle>
                <Link
                  href='/clients'
                  className='text-xs text-primary hover:underline flex items-center gap-1'
                >
                  View all <ArrowRight size={12} />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
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
              ) : (
                <div className='space-y-4'>
                  {topClients.map((client) => (
                    <div key={client.id} className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-bold text-primary-foreground'>
                          {client.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <p className='text-sm font-medium'>{client.fullName}</p>
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
