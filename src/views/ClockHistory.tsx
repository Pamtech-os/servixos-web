'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Coffee, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockEmployees } from '@/lib/team-mock-data';

const PAGE_SIZE = 5;

const ClockHistory = () => {
  const params = useParams<{ employeeId: string }>();
  const employeeId = typeof params?.employeeId === 'string' ? params.employeeId : '';
  const router = useRouter();
  const [page, setPage] = useState(1);

  const employee = mockEmployees.find((e) => e.id === employeeId);

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

  const history = employee.clockHistory;
  const totalPages = Math.ceil(history.length / PAGE_SIZE);
  const paginated = history.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

      {totalPages > 1 && (
        <div className='flex items-center justify-center gap-2 pt-2'>
          <Button
            size='sm'
            variant='outline'
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft size={14} />
          </Button>
          <span className='text-sm text-muted-foreground'>
            Page {page} of {totalPages}
          </span>
          <Button
            size='sm'
            variant='outline'
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ClockHistory;
