'use client';

import { motion } from 'framer-motion';
import { Video } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import EmployeesTab from '@/components/teams/EmployeesTab';
import SchedulingTab from '@/components/teams/SchedulingTab';
import TimeTrackingTab from '@/components/teams/TimeTrackingTab';
import TasksTab from '@/components/teams/TasksTab';
import CommunicationsTab from '@/components/teams/CommunicationsTab';
import { toast } from '@/components/ui/sonner';

const Teams = () => {
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
        <Tabs defaultValue='employees'>
          <TabsList className='w-full justify-start overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [scrollbar-width:none]'>
            <TabsTrigger value='employees' className='shrink-0'>
              Employees
            </TabsTrigger>
            <TabsTrigger value='scheduling' className='shrink-0'>
              Scheduling
            </TabsTrigger>
            <TabsTrigger value='time-tracking' className='shrink-0'>
              Time Tracking
            </TabsTrigger>
            <TabsTrigger value='tasks' className='shrink-0'>
              Tasks
            </TabsTrigger>
            <TabsTrigger value='communications' className='shrink-0'>
              Communications
            </TabsTrigger>
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
      </motion.div>
    </div>
  );
};

export default Teams;
