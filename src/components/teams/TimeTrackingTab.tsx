import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Coffee, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PaginationControls from '@/components/ui/pagination-controls';
import { mockEmployees } from '@/lib/team-mock-data';
import { paginateArray } from '@/lib/pagination';

const PAGE_SIZE = 5;

const TimeTrackingTab = () => {
  const [page, setPage] = useState(1);
  const pagination = useMemo(
    () => paginateArray(mockEmployees, page, PAGE_SIZE),
    [page]
  );
  const { data: paginated, meta: paginationMeta } = pagination;

  useEffect(() => {
    if (page !== paginationMeta.page) {
      setPage(paginationMeta.page);
    }
  }, [page, paginationMeta.page]);

  return (
    <div className='mt-4 space-y-4'>
      <h3 className='font-display text-lg font-semibold'>Team Hours Summary</h3>
      <div className='space-y-3'>
        {paginated.map((emp, i) => (
          <motion.div
            key={emp.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card>
              <CardContent className='p-4'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='gradient-bg flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-primary-foreground'>
                      {emp.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <p className='font-medium'>{emp.fullName}</p>
                      <p className='text-xs text-muted-foreground'>{emp.role}</p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3'>
                    <Badge variant='outline' className='gap-1 font-mono'>
                      <Clock size={12} /> {emp.weeklyHours}h this week
                    </Badge>
                  </div>
                </div>

                {/* Clock History */}
                {emp.clockHistory.length > 0 && (
                  <div className='mt-4 space-y-2'>
                    <p className='text-xs font-medium text-muted-foreground'>
                      Recent Clock History
                    </p>
                    <div className='space-y-1.5'>
                      {emp.clockHistory.slice(0, 3).map((record) => (
                        <div
                          key={record.id}
                          className='flex flex-col gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between'
                        >
                          <span className='font-medium'>{record.date}</span>
                          <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
                            <span className='flex items-center gap-1 text-emerald-600'>
                              <Clock size={10} /> {record.clockIn}
                            </span>
                            <span className='flex items-center gap-1 text-amber-600'>
                              <Coffee size={10} /> {record.breakMinutes}m
                            </span>
                            <span className='flex items-center gap-1 text-destructive'>
                              <LogOut size={10} /> {record.clockOut || '—'}
                            </span>
                            <Badge variant='secondary' className='text-[10px]'>
                              {record.totalHours}h
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
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

export default TimeTrackingTab;
