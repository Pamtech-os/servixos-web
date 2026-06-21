'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RevenueDataPoint {
  month: string;
  revenue: number;
}

export default function RevenueChart({ data }: { data: RevenueDataPoint[] }) {
  return (
    <ResponsiveContainer width='100%' height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id='revenueGrad' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='hsl(217, 91%, 60%)' stopOpacity={0.3} />
            <stop offset='95%' stopColor='hsl(217, 91%, 60%)' stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray='3 3' stroke='hsl(220, 13%, 88%)' opacity={0.3} />
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
  );
}
