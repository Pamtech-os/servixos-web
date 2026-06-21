'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Video } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import EmployeesTab from '@/components/teams/EmployeesTab';
import SchedulingTab from '@/components/teams/SchedulingTab';
import TimeTrackingTab from '@/components/teams/TimeTrackingTab';
import TasksTab from '@/components/teams/TasksTab';
import CommunicationsTab from '@/components/teams/CommunicationsTab';
import { toast } from '@/components/ui/sonner';
import { useAccess } from '@/hooks/permissions/use-access';

type TabDef = {
  value: string;
  label: string;
  visibleKey: keyof ReturnType<typeof useAccess>;
};

const TAB_DEFS: TabDef[] = [
  { value: 'employees', label: 'Employees', visibleKey: 'canViewEmployees' },
  { value: 'scheduling', label: 'Scheduling', visibleKey: 'canViewSchedules' },
  { value: 'time-tracking', label: 'Time Tracking', visibleKey: 'canViewTimeTracking' },
  { value: 'tasks', label: 'Tasks', visibleKey: 'canViewTasks' },
  { value: 'communications', label: 'Communications', visibleKey: 'canViewCommunications' },
];

const Teams = () => {
  const access = useAccess();

  // Only show tabs the user actually has access to — never show all while resolving
  const visibleTabs = TAB_DEFS.filter((t) => !!access[t.visibleKey]);

  // Default to the first visible tab; update when the visible set is first known
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    if (access.isResolving || visibleTabs.length === 0) return;
    setActiveTab((prev) => {
      const stillVisible = visibleTabs.some((t) => t.value === prev);
      return stillVisible ? prev : visibleTabs[0].value;
    });
  }, [access.isResolving]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConferenceCall = () => {
    toast.success('Conference call started', {
      description: 'All team members have been notified to join the video call.',
    });
  };

  return (
    <div className='space-y-4 sm:space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='font-display text-xl font-bold sm:text-2xl'>Teams</h1>
          <p className='text-sm text-muted-foreground'>
            Manage your team, schedules, tasks, and communications.
          </p>
        </div>
        <Button
          onClick={handleConferenceCall}
          className='w-full gap-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 sm:w-auto'
        >
          <Video size={16} /> Conference Call
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {access.isResolving ? (
          <div className='space-y-4'>
            <div className='flex gap-2'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='h-9 w-24 rounded-md' />
              ))}
            </div>
            <Skeleton className='h-64 w-full rounded-xl' />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className='w-full justify-start overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [scrollbar-width:none]'>
              {visibleTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className='shrink-0'>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value='employees'>
              <EmployeesTab />
            </TabsContent>
            <TabsContent value='scheduling'>
              <SchedulingTab />
            </TabsContent>
            <TabsContent value='time-tracking'>
              <TimeTrackingTab />
            </TabsContent>
            <TabsContent value='tasks'>
              <TasksTab />
            </TabsContent>
            <TabsContent value='communications'>
              <CommunicationsTab />
            </TabsContent>
          </Tabs>
        )}
      </motion.div>
    </div>
  );
};

export default Teams;
