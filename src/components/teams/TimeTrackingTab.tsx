import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Coffee, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockEmployees } from '@/lib/team-mock-data';

const PAGE_SIZE = 5;

const TimeTrackingTab = () => {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(mockEmployees.length / PAGE_SIZE);
  const paginated = mockEmployees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
                    <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-bold text-primary-foreground'>
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

export default TimeTrackingTab;
