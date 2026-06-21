'use client';

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface JobsStatusDataPoint {
  name: string;
  value: number;
  fill: string;
}

export default function JobsStatusChart({ data }: { data: JobsStatusDataPoint[] }) {
  return (
    <ResponsiveContainer width='100%' height={260}>
      <PieChart>
        <Pie
          data={data}
          cx='50%'
          cy='45%'
          innerRadius={55}
          outerRadius={85}
          dataKey='value'
          paddingAngle={4}
          strokeWidth={0}
        >
          {data.map((entry, index) => (
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
  );
}
