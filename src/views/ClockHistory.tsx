'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Coffee, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PaginationControls from '@/components/ui/pagination-controls';
import { mockEmployees } from '@/lib/team-mock-data';
import { paginateArray } from '@/lib/pagination';

const PAGE_SIZE = 5;

const ClockHistory = () => {
  const params = useParams<{ employeeId: string }>();
  const employeeId = typeof params?.employeeId === 'string' ? params.employeeId : '';
  const router = useRouter();
  const [page, setPage] = useState(1);

  const employee = mockEmployees.find((e) => e.id === employeeId);
  const history = useMemo(() => employee?.clockHistory ?? [], [employee]);
  const pagination = useMemo(
    () => paginateArray(history, page, PAGE_SIZE),
    [history, page]
  );
  const { data: paginated, meta: paginationMeta } = pagination;

  useEffect(() => {
    if (page !== paginationMeta.page) {
      setPage(paginationMeta.page);
    }
  }, [page, paginationMeta.page]);

  if (!employee) {
    return (
      <div className='flex flex-col items-center justify-center py-20'>
        <p className='text-muted-foreground'>Employee not found.</p>
        <button
          onClick={() => router.push('/teams')}
          className='mt-4 text-sm text-primary hover:underline'
        >
          Back to Teams
        </button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3'>
        <button
          onClick={() => router.push('/teams')}
          className='flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground'
        >
          <ArrowLeft size={16} /> Back to Teams
        </button>
      </div>

      <div>
        <h1 className='font-display text-2xl font-bold'>Clock History</h1>
        <p className='text-sm text-muted-foreground'>
          {employee.fullName} · {employee.role}
        </p>
      </div>

      <div className='space-y-3'>
        {paginated.length === 0 ? (
          <Card>
            <CardContent className='py-12 text-center text-sm text-muted-foreground'>
              No clock history found.
            </CardContent>
          </Card>
        ) : (
          paginated.map((record, i) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card>
                <CardContent className='flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='font-medium'>{record.date}</div>
                  <div className='flex flex-wrap items-center gap-3 text-sm'>
                    <span className='flex items-center gap-1.5 text-emerald-600'>
                      <Clock size={14} /> In: {record.clockIn}
                    </span>
                    <span className='flex items-center gap-1.5 text-amber-600'>
                      <Coffee size={14} /> Break: {record.breakMinutes}m
                    </span>
                    <span className='flex items-center gap-1.5 text-destructive'>
                      <LogOut size={14} /> Out: {record.clockOut || '—'}
                    </span>
                    <Badge variant='secondary'>{record.totalHours}h total</Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <PaginationControls
        meta={paginationMeta}
        onPageChange={setPage}
        layout='centered'
        className='pt-2'
        buttonSize='sm'
      />
    </div>
  );
};

export default ClockHistory;
