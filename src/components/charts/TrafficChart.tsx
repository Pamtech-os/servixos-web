'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TrafficDataPoint {
  date: string;
  visitors: number;
  pageViews: number;
}

export default function TrafficChart({ data }: { data: TrafficDataPoint[] }) {
  return (
    <ResponsiveContainer width='100%' height={340}>
      <AreaChart data={data}>
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
        <CartesianGrid strokeDasharray='3 3' stroke='hsl(220, 13%, 88%)' opacity={0.3} />
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
  );
}
