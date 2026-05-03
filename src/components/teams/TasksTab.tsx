import { useState, type DragEvent } from 'react';
import { format, parse } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Plus,
  MessageSquare,
  CalendarDays,
  CheckSquare,
  Square,
  Flag,
  Send,
  Upload,
  Paperclip,
  Smile,
  MoreHorizontal,
  CalendarIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { mockTasks, mockEmployees, Task, Subtask, TaskComment } from '@/lib/team-mock-data';
import { toast } from '@/components/ui/sonner';

const stages = [
  {
    key: 'todo' as const,
    label: 'TO DO',
    color: 'border-l-muted-foreground',
    dotClass: 'bg-muted-foreground',
  },
  {
    key: 'in_progress' as const,
    label: 'IN PROGRESS',
    color: 'border-l-primary',
    dotClass: 'bg-primary',
  },
  {
    key: 'completed' as const,
    label: 'COMPLETED',
    color: 'border-l-emerald-500',
    dotClass: 'bg-emerald-500',
  },
];

const priorityConfig = {
  urgent: { label: 'Urgent', class: 'bg-destructive/10 text-destructive border-destructive/30' },
  high: { label: 'High', class: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  medium: { label: 'Medium', class: 'bg-primary/10 text-primary border-primary/30' },
  low: { label: 'Low', class: 'bg-muted text-muted-foreground border-border' },
};

const TasksTab = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<'active' | 'closed'>('active');
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'details' | 'subtasks'>('details');
  const [form, setForm] = useState({
    title: '',
    description: '',
    assigneeId: '',
    priority: 'medium' as Task['priority'],
    dueDate: '',
    stage: 'todo' as Task['stage'],
  });

  const filteredTasks = tasks.filter((t) => t.status === statusFilter);

  const handleCreate = () => {
    if (!form.title || !form.assigneeId) {
      toast.error('Title and assignee are required.');
      return;
    }
    const emp = mockEmployees.find((e) => e.id === form.assigneeId);
    const newTask: Task = {
      id: `t${Date.now()}`,
      title: form.title,
      description: form.description,
      assigneeId: form.assigneeId,
      assigneeName: emp?.fullName || 'Unknown',
      stage: form.stage,
      priority: form.priority,
      dueDate: form.dueDate,
      createdAt: new Date().toISOString().split('T')[0],
      comments: [],
      subtasks: [],
      status: 'active',
    };
    setTasks((prev) => [newTask, ...prev]);
    setForm({
      title: '',
      description: '',
      assigneeId: '',
      priority: 'medium',
      dueDate: '',
      stage: 'todo',
    });
    setShowCreate(false);
    toast.success('Task created!');
  };

  const moveTask = (taskId: string, newStage: Task['stage']) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, stage: newStage } : t)));
    if (showDetail?.id === taskId)
      setShowDetail((prev) => (prev ? { ...prev, stage: newStage } : null));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((st) =>
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
              ),
            }
          : t
      )
    );
    if (showDetail?.id === taskId) {
      setShowDetail((prev) =>
        prev
          ? {
              ...prev,
              subtasks: prev.subtasks.map((st) =>
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
              ),
            }
          : null
      );
    }
  };

  const addComment = () => {
    if (!newComment.trim() || !showDetail) return;
    const comment: TaskComment = {
      id: `tc${Date.now()}`,
      author: 'Business Owner',
      content: newComment,
      time: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
    setTasks((prev) =>
      prev.map((t) => (t.id === showDetail.id ? { ...t, comments: [...t.comments, comment] } : t))
    );
    setShowDetail((prev) => (prev ? { ...prev, comments: [...prev.comments, comment] } : null));
    setNewComment('');
  };

  const addSubtask = () => {
    if (!newSubtask.trim() || !showDetail) return;
    const subtask: Subtask = { id: `st${Date.now()}`, title: newSubtask, completed: false };
    setTasks((prev) =>
      prev.map((t) => (t.id === showDetail.id ? { ...t, subtasks: [...t.subtasks, subtask] } : t))
    );
    setShowDetail((prev) => (prev ? { ...prev, subtasks: [...prev.subtasks, subtask] } : null));
    setNewSubtask('');
  };

  // Drag and drop handlers
  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: DragEvent, stageKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageKey);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: DragEvent, stageKey: Task['stage']) => {
    e.preventDefault();
    if (draggedTaskId) {
      moveTask(draggedTaskId, stageKey);
      toast.success(`Task moved to ${stages.find((s) => s.key === stageKey)?.label}`);
    }
    setDraggedTaskId(null);
    setDragOverStage(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverStage(null);
  };

  // Check if due date is overdue
  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className='mt-4 space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-2'>
          <Button
            size='sm'
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('active')}
          >
            Active
          </Button>
          <Button
            size='sm'
            variant={statusFilter === 'closed' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('closed')}
          >
            Closed
          </Button>
        </div>
        <Button size='sm' className='w-full gap-1.5 sm:w-auto' onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Create Task
        </Button>
      </div>

      {/* Board View with Drag and Drop */}
      <div className='grid gap-4 lg:grid-cols-3'>
        {stages.map((stage) => {
          const stageTasks = filteredTasks.filter((t) => t.stage === stage.key);
          return (
            <div
              key={stage.key}
              className={`space-y-3 rounded-lg p-3 transition-colors ${
                dragOverStage === stage.key ? 'bg-primary/5 ring-2 ring-primary/20' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, stage.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.key)}
            >
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <span className={`h-2 w-2 rounded-full ${stage.dotClass}`} />
                  <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                    {stage.label}
                  </span>
                  <span className='flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground'>
                    {stageTasks.length}
                  </span>
                </div>
              </div>
              <div className='space-y-2 min-h-[80px]'>
                {stageTasks.map((task) => {
                  const p = priorityConfig[task.priority];
                  return (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: draggedTaskId === task.id ? 0.5 : 1 }}
                      draggable
                      onDragStart={() => handleDragStart(task.id)}
                      onDragEnd={handleDragEnd}
                      className='cursor-grab active:cursor-grabbing'
                    >
                      <Card
                        className={`border-l-4 ${stage.color} transition-all hover:shadow-md`}
                        onClick={() => {
                          setShowDetail(task);
                          setDetailTab('details');
                        }}
                      >
                        <CardContent className='p-3 space-y-2'>
                          <div className='flex items-start justify-between'>
                            <p className='text-sm font-medium leading-tight'>{task.title}</p>
                            <Badge
                              variant='outline'
                              className={`text-[10px] shrink-0 ml-2 ${p.class}`}
                            >
                              {p.label}
                            </Badge>
                          </div>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-1.5'>
                              <div className='flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] font-bold'>
                                {task.assigneeName
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </div>
                              <span className='text-[10px] text-muted-foreground'>
                                {task.assigneeName.split(' ')[0]}
                              </span>
                            </div>
                            <div className='flex items-center gap-2 text-[10px] text-muted-foreground'>
                              {task.comments.length > 0 && (
                                <span className='flex items-center gap-0.5'>
                                  <MessageSquare size={10} /> {task.comments.length}
                                </span>
                              )}
                              {task.dueDate && (
                                <span
                                  className={`flex items-center gap-0.5 ${
                                    isOverdue(task.dueDate) && task.stage !== 'completed'
                                      ? 'text-destructive font-semibold'
                                      : ''
                                  }`}
                                >
                                  <CalendarDays size={10} /> {task.dueDate.slice(5)}
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
                {stageTasks.length === 0 && (
                  <div className='rounded-lg border-2 border-dashed border-border p-6 text-center text-xs text-muted-foreground'>
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder='Task title'
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder='Describe the task...'
                rows={3}
              />
            </div>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <div>
                <Label>Assignee *</Label>
                <Select
                  value={form.assigneeId}
                  onValueChange={(v) => setForm({ ...form, assigneeId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Assign to' />
                  </SelectTrigger>
                  <SelectContent>
                    {mockEmployees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v as Task['priority'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='low'>Low</SelectItem>
                    <SelectItem value='medium'>Medium</SelectItem>
                    <SelectItem value='high'>High</SelectItem>
                    <SelectItem value='urgent'>Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <div>
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !form.dueDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {form.dueDate ? (
                        format(parse(form.dueDate, 'yyyy-MM-dd', new Date()), 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={
                        form.dueDate ? parse(form.dueDate, 'yyyy-MM-dd', new Date()) : undefined
                      }
                      onSelect={(d) => d && setForm({ ...form, dueDate: format(d, 'yyyy-MM-dd') })}
                      initialFocus
                      className={cn('p-3 pointer-events-auto')}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Stage</Label>
                <Select
                  value={form.stage}
                  onValueChange={(v) => setForm({ ...form, stage: v as Task['stage'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='todo'>To Do</SelectItem>
                    <SelectItem value='in_progress'>In Progress</SelectItem>
                    <SelectItem value='completed'>Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Detail Dialog - ClickUp style two-column layout */}
      <Dialog open={!!showDetail} onOpenChange={(open) => !open && setShowDetail(null)}>
        <DialogContent className='flex h-[90dvh] max-w-[95vw] flex-col overflow-hidden p-0 sm:max-w-4xl'>
          {showDetail && (
            <>
              <div className='flex items-center justify-between border-b border-border px-4 py-3 sm:px-6 sm:py-4'>
                <h2 className='text-base font-semibold'>task_details</h2>
              </div>

              <div className='flex flex-1 flex-col overflow-hidden lg:flex-row'>
                {/* Left side - Task details */}
                <div className='flex-1 space-y-5 overflow-y-auto border-b border-border p-4 lg:border-b-0 lg:border-r lg:p-6'>
                  <h3 className='text-xl font-bold'>{showDetail.title}</h3>

                  {/* Meta fields */}
                  <div className='rounded-lg border border-border p-4 space-y-3'>
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                      <div className='flex items-center gap-3'>
                        <span className='text-sm text-muted-foreground'>stage</span>
                        <Select
                          value={showDetail.stage}
                          onValueChange={(v) => moveTask(showDetail.id, v as Task['stage'])}
                        >
                          <SelectTrigger className='h-7 w-[120px] text-xs'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='todo'>to do</SelectItem>
                            <SelectItem value='in_progress'>in progress</SelectItem>
                            <SelectItem value='completed'>completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className='flex items-center gap-3'>
                        <span className='text-sm text-muted-foreground'>assignee</span>
                        <div className='flex items-center gap-1.5'>
                          <Avatar className='h-6 w-6'>
                            <AvatarFallback className='text-[9px] bg-muted'>
                              {showDetail.assigneeName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className='text-sm'>{showDetail.assigneeName}</span>
                        </div>
                      </div>
                    </div>
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                      <div className='flex items-center gap-3'>
                        <span className='text-sm text-muted-foreground'>start_date</span>
                        <span className='flex items-center gap-1 text-sm'>
                          <CalendarDays size={14} /> {showDetail.createdAt}
                        </span>
                      </div>
                      <div className='flex items-center gap-3'>
                        <span className='text-sm text-muted-foreground'>due_date</span>
                        <span
                          className={`flex items-center gap-1 text-sm ${
                            isOverdue(showDetail.dueDate) && showDetail.stage !== 'completed'
                              ? 'text-destructive font-semibold'
                              : ''
                          }`}
                        >
                          <CalendarDays size={14} /> {showDetail.dueDate || '—'}
                        </span>
                        {isOverdue(showDetail.dueDate) && showDetail.stage !== 'completed' && (
                          <Badge
                            variant='outline'
                            className='text-[10px] bg-destructive/10 text-destructive border-destructive/30'
                          >
                            overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className='flex items-center gap-3'>
                      <span className='text-sm text-muted-foreground'>priority</span>
                      <div className='flex items-center gap-1.5'>
                        <Flag
                          size={14}
                          className={
                            showDetail.priority === 'urgent'
                              ? 'text-destructive'
                              : showDetail.priority === 'high'
                              ? 'text-amber-500'
                              : 'text-primary'
                          }
                        />
                        <Select
                          value={showDetail.priority}
                          onValueChange={(v) => {
                            const newPriority = v as Task['priority'];
                            setTasks((prev) =>
                              prev.map((t) =>
                                t.id === showDetail.id ? { ...t, priority: newPriority } : t
                              )
                            );
                            setShowDetail((prev) =>
                              prev ? { ...prev, priority: newPriority } : null
                            );
                          }}
                        >
                          <SelectTrigger className='h-7 w-[110px] text-xs border-none p-0'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='low'>low</SelectItem>
                            <SelectItem value='medium'>medium</SelectItem>
                            <SelectItem value='high'>high</SelectItem>
                            <SelectItem value='urgent'>urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm font-semibold'>description</span>
                      <span className='text-xs text-muted-foreground'>
                        {showDetail.description?.length || 0}/100
                      </span>
                    </div>
                    <div className='rounded-lg border border-border bg-muted/30 p-3 min-h-[40px]'>
                      <p className='text-sm'>{showDetail.description || ''}</p>
                    </div>
                  </div>

                  {/* Tabs: details / subtasks */}
                  <Tabs
                    value={detailTab}
                    onValueChange={(v) => setDetailTab(v as 'details' | 'subtasks')}
                  >
                    <TabsList className='h-8'>
                      <TabsTrigger value='details' className='text-xs'>
                        details
                      </TabsTrigger>
                      <TabsTrigger value='subtasks' className='text-xs'>
                        subtasks
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value='details' className='mt-3 space-y-3'>
                      <div>
                        <span className='text-sm font-semibold'>attachments</span>
                        <div className='mt-2 rounded-lg border-2 border-dashed border-border p-8 text-center'>
                          <Upload size={24} className='mx-auto mb-2 text-muted-foreground' />
                          <p className='text-sm text-muted-foreground'>drag_and_drop_file_here</p>
                          <p className='text-xs text-muted-foreground my-1'>or</p>
                          <Button variant='outline' size='sm' className='text-xs'>
                            browse_file
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value='subtasks' className='mt-3 space-y-2'>
                      <p className='text-xs text-muted-foreground mb-2'>
                        {showDetail.subtasks.filter((s) => s.completed).length}/
                        {showDetail.subtasks.length} completed
                      </p>
                      {showDetail.subtasks.map((st) => (
                        <button
                          key={st.id}
                          onClick={() => toggleSubtask(showDetail.id, st.id)}
                          className='flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50'
                        >
                          {st.completed ? (
                            <CheckSquare size={14} className='text-emerald-500' />
                          ) : (
                            <Square size={14} className='text-muted-foreground' />
                          )}
                          <span
                            className={st.completed ? 'text-muted-foreground line-through' : ''}
                          >
                            {st.title}
                          </span>
                        </button>
                      ))}
                      <div className='flex gap-2 mt-2'>
                        <Input
                          value={newSubtask}
                          onChange={(e) => setNewSubtask(e.target.value)}
                          placeholder='Add subtask...'
                          className='h-8 text-xs'
                          onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                        />
                        <Button
                          size='sm'
                          variant='outline'
                          className='h-8 shrink-0'
                          onClick={addSubtask}
                        >
                          <Plus size={12} />
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Right side - Activity / Comments timeline */}
                <div className='flex h-[42dvh] flex-col bg-muted/20 lg:h-auto lg:w-[380px]'>
                  <div className='px-4 py-3 border-b border-border'>
                    <h4 className='text-sm font-bold'>activity</h4>
                  </div>

                  <ScrollArea className='flex-1 p-4'>
                    <div className='space-y-4'>
                      {/* Timeline */}
                      {showDetail.comments.length === 0 && (
                        <p className='text-xs text-muted-foreground text-center py-8'>
                          No activity yet.
                        </p>
                      )}
                      {showDetail.comments.map((c, i) => (
                        <div key={c.id} className='relative'>
                          {/* Timeline line */}
                          {i < showDetail.comments.length - 1 && (
                            <div className='absolute left-4 top-10 bottom-0 w-px bg-border' />
                          )}
                          <div className='flex items-start gap-3'>
                            <div className='text-[10px] text-muted-foreground whitespace-nowrap pt-1 w-full text-center mb-1'>
                              {c.time}
                            </div>
                          </div>
                          <div className='flex items-start gap-3 mt-1'>
                            <Avatar className='h-7 w-7 shrink-0'>
                              <AvatarFallback className='text-[9px] bg-primary/20 text-primary font-bold'>
                                {c.author
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className='flex-1 rounded-lg border border-border bg-card p-3'>
                              <div className='flex items-center justify-between mb-1'>
                                <span className='text-xs font-bold'>{c.author}</span>
                                <button className='text-muted-foreground hover:text-foreground'>
                                  <MoreHorizontal size={14} />
                                </button>
                              </div>
                              <p className='text-sm'>{c.content}</p>
                              <div className='flex items-center justify-between mt-2'>
                                <button className='text-muted-foreground hover:text-foreground'>
                                  <Smile size={14} />
                                </button>
                                <span className='text-[10px] text-primary cursor-pointer hover:underline'>
                                  0 replies
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Comment input */}
                  <div className='border-t border-border p-3'>
                    <div className='rounded-lg border border-border bg-card p-3'>
                      <Input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder='write_a_comment'
                        className='border-none bg-transparent p-0 h-6 text-sm focus-visible:ring-0 shadow-none'
                        onKeyDown={(e) => e.key === 'Enter' && addComment()}
                      />
                      <div className='flex items-center justify-between mt-2'>
                        <div className='flex items-center gap-2'>
                          <button className='text-muted-foreground hover:text-foreground'>
                            <Smile size={16} />
                          </button>
                          <button className='text-muted-foreground hover:text-foreground'>
                            <Paperclip size={16} />
                          </button>
                        </div>
                        <Button size='sm' className='h-7 w-7 rounded-full p-0' onClick={addComment}>
                          <Send size={12} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksTab;
