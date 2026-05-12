'use client';

import { useState, useEffect, useRef, type DragEvent } from 'react';
import { format, parse, isPast, isToday, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Plus,
  MessageSquare,
  CalendarDays,
  CheckSquare,
  Square,
  Flag,
  Send,
  CalendarIcon,
  Loader2,
  Paperclip,
  X,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';
import { type TaskStage, type TaskPriority, type CreateTaskInput } from '@/lib/api-client';
import { useTasks, useTaskActivities } from '@/hooks/queries/use-tasks';
import { useEmployees } from '@/hooks/queries/use-employees';
import {
  useCreateTask,
  useUpdateTask,
  useAddComment,
  useAddSubtask,
  useToggleSubtask,
} from '@/hooks/mutations/use-tasks';

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

interface LocalAttachment {
  id: string;
  name: string;
  size: number;
  url: string;
  type: string;
}

function resolveAssigneeName(
  assigneeId: string | { _id: string; fullName: string } | undefined,
  employeeMap: Map<string, string>
): string | null {
  if (!assigneeId) return null;
  if (typeof assigneeId === 'object') return assigneeId.fullName;
  return employeeMap.get(assigneeId) ?? null;
}

function resolveAssigneeId(
  assigneeId: string | { _id: string; fullName: string } | undefined
): string {
  if (!assigneeId) return '';
  if (typeof assigneeId === 'object') return assigneeId._id;
  return assigneeId;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const priorityConfig: Record<TaskPriority, { label: string; class: string }> = {
  urgent: { label: 'Urgent', class: 'bg-destructive/10 text-destructive border-destructive/30' },
  high: { label: 'High', class: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  medium: { label: 'Medium', class: 'bg-primary/10 text-primary border-primary/30' },
  low: { label: 'Low', class: 'bg-muted text-muted-foreground border-border' },
};

const TasksTab = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterDueDate, setFilterDueDate] = useState('all');
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const [fileDragOver, setFileDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAttachments((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.url));
      return [];
    });
    setFileDragOver(false);
    setNewComment('');
    setNewSubtask('');
  }, [selectedTaskId]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    assigneeId: '',
    priority: 'medium' as TaskPriority,
    dueDate: '',
    stage: 'todo' as TaskStage,
  });

  const serverQuery = {
    assigneeId: filterAssignee !== 'all' ? filterAssignee : undefined,
    priority: filterPriority !== 'all' ? (filterPriority as TaskPriority) : undefined,
    limit: 100,
  };

  const { data: tasksData, isLoading: tasksLoading } = useTasks(serverQuery);
  const { data: employeesData } = useEmployees();
  const { data: activitiesData, isLoading: activitiesLoading } = useTaskActivities(
    selectedTaskId ?? ''
  );

  const allTasks = tasksData?.data ?? [];
  const allEmployees = employeesData?.data ?? [];
  const activities = activitiesData?.data ?? [];

  const employeeMap = new Map(allEmployees.map((e) => [e._id, e.fullName]));
  const selectedTask = selectedTaskId
    ? allTasks.find((t) => t._id === selectedTaskId) ?? null
    : null;

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const addCommentMutation = useAddComment();
  const addSubtaskMutation = useAddSubtask();
  const toggleSubtaskMutation = useToggleSubtask();

  const filteredTasks = allTasks.filter((t) => {
    if (filterDueDate !== 'all') {
      if (!t.dueDate) return filterDueDate === 'none';
      const due = new Date(t.dueDate);
      const now = new Date();
      if (filterDueDate === 'overdue')
        return isPast(due) && !isToday(due) && t.stage !== 'completed';
      if (filterDueDate === 'today') return isToday(due);
      if (filterDueDate === 'this_week')
        return isWithinInterval(due, { start: startOfWeek(now), end: endOfWeek(now) });
    }
    return true;
  });

  const handleCreate = () => {
    if (!form.title.trim()) {
      toast.error('Title is required.');
      return;
    }
    const input: CreateTaskInput = {
      title: form.title,
      description: form.description || undefined,
      assigneeId: form.assigneeId || undefined,
      stage: form.stage,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
    };
    createTask.mutate(input, {
      onSuccess: () => {
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
      },
      onError: () => toast.error('Failed to create task.'),
    });
  };

  const moveTask = (taskId: string, newStage: TaskStage) => {
    updateTask.mutate(
      { id: taskId, input: { stage: newStage } },
      {
        onSuccess: () =>
          toast.success(`Task moved to ${stages.find((s) => s.key === newStage)?.label}`),
        onError: () => toast.error('Failed to update task.'),
      }
    );
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string, currentCompleted: boolean) => {
    toggleSubtaskMutation.mutate(
      { id: taskId, subtaskId, completed: !currentCompleted },
      { onError: () => toast.error('Failed to update subtask.') }
    );
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedTaskId) return;
    addCommentMutation.mutate(
      { id: selectedTaskId, content: newComment },
      {
        onSuccess: () => setNewComment(''),
        onError: () => toast.error('Failed to add comment.'),
      }
    );
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim() || !selectedTaskId) return;
    addSubtaskMutation.mutate(
      { id: selectedTaskId, title: newSubtask },
      {
        onSuccess: () => setNewSubtask(''),
        onError: () => toast.error('Failed to add subtask.'),
      }
    );
  };

  const handleDragStart = (taskId: string) => setDraggedTaskId(taskId);

  const handleDragOver = (e: DragEvent, stageKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageKey);
  };

  const handleDragLeave = () => setDragOverStage(null);

  const handleDrop = (e: DragEvent, stageKey: TaskStage) => {
    e.preventDefault();
    if (draggedTaskId) moveTask(draggedTaskId, stageKey);
    setDraggedTaskId(null);
    setDragOverStage(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverStage(null);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles: LocalAttachment[] = Array.from(files).map((file) => ({
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
      type: file.type,
    }));
    setAttachments((prev) => [...prev, ...newFiles]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) URL.revokeObjectURL(file.url);
      return prev.filter((f) => f.id !== id);
    });
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className='mt-4 space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-wrap items-center gap-2'>
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className='h-8 w-[140px] text-xs'>
              <SelectValue placeholder='Assignee' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Assignees</SelectItem>
              {allEmployees.map((e) => (
                <SelectItem key={e._id} value={e._id}>
                  {e.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className='h-8 w-[120px] text-xs'>
              <SelectValue placeholder='Priority' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Priorities</SelectItem>
              <SelectItem value='urgent'>Urgent</SelectItem>
              <SelectItem value='high'>High</SelectItem>
              <SelectItem value='medium'>Medium</SelectItem>
              <SelectItem value='low'>Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterDueDate} onValueChange={setFilterDueDate}>
            <SelectTrigger className='h-8 w-[120px] text-xs'>
              <SelectValue placeholder='Due Date' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Dates</SelectItem>
              <SelectItem value='overdue'>Overdue</SelectItem>
              <SelectItem value='today'>Due Today</SelectItem>
              <SelectItem value='this_week'>This Week</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size='sm' className='w-full gap-1.5 sm:w-auto' onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Create Task
        </Button>
      </div>

      {/* Board View with Drag and Drop */}
      {tasksLoading ? (
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
        </div>
      ) : (
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
                <div className='min-h-[80px] space-y-2'>
                  {stageTasks.map((task) => {
                    const p = priorityConfig[task.priority ?? 'medium'];
                    const assigneeName = resolveAssigneeName(task.assigneeId, employeeMap);
                    return (
                      <motion.div
                        key={task._id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: draggedTaskId === task._id ? 0.5 : 1 }}
                        draggable
                        onDragStart={() => handleDragStart(task._id)}
                        onDragEnd={handleDragEnd}
                        className='cursor-grab active:cursor-grabbing'
                      >
                        <Card
                          className={`border-l-4 ${stage.color} transition-all hover:shadow-md`}
                          onClick={() => setSelectedTaskId(task._id)}
                        >
                          <CardContent className='space-y-2 p-3'>
                            <div className='flex items-start justify-between'>
                              <p className='text-sm font-medium leading-tight'>{task.title}</p>
                              <Badge
                                variant='outline'
                                className={`ml-2 shrink-0 text-[10px] ${p.class}`}
                              >
                                {p.label}
                              </Badge>
                            </div>
                            <div className='flex items-center justify-between'>
                              <div className='flex items-center gap-1.5'>
                                {assigneeName ? (
                                  <>
                                    <div className='flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] font-bold'>
                                      {assigneeName
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')}
                                    </div>
                                    <span className='text-[10px] text-muted-foreground'>
                                      {assigneeName.split(' ')[0]}
                                    </span>
                                  </>
                                ) : (
                                  <span className='text-[10px] text-muted-foreground'>
                                    Unassigned
                                  </span>
                                )}
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
                                        ? 'font-semibold text-destructive'
                                        : ''
                                    }`}
                                  >
                                    <CalendarDays size={10} />
                                    {format(new Date(task.dueDate), 'MM/dd')}
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
      )}

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
                <Label>Assignee</Label>
                <Select
                  value={form.assigneeId}
                  onValueChange={(v) => setForm({ ...form, assigneeId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Assign to' />
                  </SelectTrigger>
                  <SelectContent>
                    {allEmployees.map((e) => (
                      <SelectItem key={e._id} value={e._id}>
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
                  onValueChange={(v) => setForm({ ...form, priority: v as TaskPriority })}
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
                  onValueChange={(v) => setForm({ ...form, stage: v as TaskStage })}
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
            <Button onClick={handleCreate} disabled={createTask.isPending}>
              {createTask.isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTaskId} onOpenChange={(open) => !open && setSelectedTaskId(null)}>
        <DialogContent className='flex h-[90dvh] max-w-[95vw] flex-col overflow-hidden p-0 sm:max-w-5xl'>
          {selectedTask ? (
            <>
              {/* Header */}
              <div className='flex items-center border-b border-border px-5 py-3.5 sm:px-6'>
                <DialogTitle className='text-sm font-medium text-muted-foreground'>
                  Task Details
                </DialogTitle>
              </div>

              <div className='flex flex-1 flex-col overflow-hidden lg:flex-row'>
                {/* Left column */}
                <div className='flex-1 space-y-5 overflow-y-auto border-b border-border p-5 lg:border-b-0 lg:border-r lg:p-6'>
                  {/* Title */}
                  <h3 className='text-xl font-bold leading-snug'>{selectedTask.title}</h3>

                  {/* Properties */}
                  <div className='grid grid-cols-2 gap-x-6 gap-y-3'>
                    {/* Stage */}
                    <div className='flex items-center gap-2'>
                      <span className='w-20 shrink-0 text-xs text-muted-foreground'>Stage</span>
                      <Select
                        value={selectedTask.stage}
                        onValueChange={(v) => moveTask(selectedTask._id, v as TaskStage)}
                      >
                        <SelectTrigger className='h-7 text-xs'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='todo'>To Do</SelectItem>
                          <SelectItem value='in_progress'>In Progress</SelectItem>
                          <SelectItem value='completed'>Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Assignee — editable */}
                    <div className='flex items-center gap-2'>
                      <span className='w-20 shrink-0 text-xs text-muted-foreground'>Assignee</span>
                      <Select
                        value={resolveAssigneeId(selectedTask.assigneeId)}
                        onValueChange={(v) =>
                          v &&
                          updateTask.mutate({
                            id: selectedTask._id,
                            input: { assigneeId: v },
                          })
                        }
                      >
                        <SelectTrigger className='h-7 text-xs'>
                          <SelectValue placeholder='Unassigned' />
                        </SelectTrigger>
                        <SelectContent>
                          {allEmployees.map((e) => (
                            <SelectItem key={e._id} value={e._id}>
                              {e.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Due Date — editable */}
                    <div className='flex items-center gap-2'>
                      <span className='w-20 shrink-0 text-xs text-muted-foreground'>Due Date</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant='outline'
                            size='sm'
                            className={cn(
                              'h-7 gap-1 text-xs font-normal',
                              isOverdue(selectedTask.dueDate) &&
                                selectedTask.stage !== 'completed' &&
                                'border-destructive/50 text-destructive hover:text-destructive'
                            )}
                          >
                            <CalendarDays size={11} />
                            {selectedTask.dueDate
                              ? format(new Date(selectedTask.dueDate), 'MMM d, yyyy')
                              : 'Not set'}
                            {isOverdue(selectedTask.dueDate) &&
                              selectedTask.stage !== 'completed' && (
                                <Badge
                                  variant='outline'
                                  className='border-destructive/30 bg-destructive/10 py-0 text-[9px] text-destructive'
                                >
                                  Overdue
                                </Badge>
                              )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={
                              selectedTask.dueDate ? new Date(selectedTask.dueDate) : undefined
                            }
                            onSelect={(d) =>
                              d &&
                              updateTask.mutate({
                                id: selectedTask._id,
                                input: { dueDate: format(d, 'yyyy-MM-dd') },
                              })
                            }
                            className={cn('p-3 pointer-events-auto')}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Priority */}
                    <div className='flex items-center gap-2'>
                      <span className='w-20 shrink-0 text-xs text-muted-foreground'>Priority</span>
                      <div className='flex items-center gap-1'>
                        <Flag
                          size={12}
                          className={
                            selectedTask.priority === 'urgent'
                              ? 'text-destructive'
                              : selectedTask.priority === 'high'
                              ? 'text-amber-500'
                              : 'text-primary'
                          }
                        />
                        <Select
                          value={selectedTask.priority ?? 'medium'}
                          onValueChange={(v) =>
                            updateTask.mutate({
                              id: selectedTask._id,
                              input: { priority: v as TaskPriority },
                            })
                          }
                        >
                          <SelectTrigger className='h-7 border-none p-0 text-xs shadow-none focus:ring-0'>
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
                  </div>

                  <Separator />

                  {/* Description — auto-saves on blur */}
                  <div className='space-y-1.5'>
                    <span className='text-sm font-semibold'>Description</span>
                    <Textarea
                      key={selectedTask._id}
                      defaultValue={selectedTask.description ?? ''}
                      placeholder='Add a description...'
                      className='min-h-[80px] resize-none text-sm'
                      onBlur={(e) => {
                        const trimmed = e.target.value.trim();
                        if (trimmed !== (selectedTask.description ?? '').trim()) {
                          updateTask.mutate({
                            id: selectedTask._id,
                            input: { description: trimmed || undefined },
                          });
                        }
                      }}
                    />
                  </div>

                  <Separator />

                  {/* Subtasks */}
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-semibold'>Subtasks</span>
                      {selectedTask.subtasks.length > 0 && (
                        <span className='text-xs text-muted-foreground'>
                          {selectedTask.subtasks.filter((s) => s.completed).length} /{' '}
                          {selectedTask.subtasks.length} completed
                        </span>
                      )}
                    </div>
                    {selectedTask.subtasks.length > 0 && (
                      <div className='space-y-1'>
                        {selectedTask.subtasks.map((st) => (
                          <button
                            key={st._id}
                            onClick={() =>
                              handleToggleSubtask(selectedTask._id, st._id, st.completed)
                            }
                            className='flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/50'
                          >
                            {st.completed ? (
                              <CheckSquare size={14} className='shrink-0 text-emerald-500' />
                            ) : (
                              <Square size={14} className='shrink-0 text-muted-foreground' />
                            )}
                            <span
                              className={st.completed ? 'text-muted-foreground line-through' : ''}
                            >
                              {st.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className='flex gap-2'>
                      <Input
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        placeholder='Add a subtask...'
                        className='h-8 text-xs'
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                      />
                      <Button
                        size='sm'
                        variant='outline'
                        className='h-8 shrink-0'
                        onClick={handleAddSubtask}
                        disabled={addSubtaskMutation.isPending}
                      >
                        {addSubtaskMutation.isPending ? (
                          <Loader2 size={12} className='animate-spin' />
                        ) : (
                          <Plus size={12} />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Attachments */}
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-semibold'>Attachments</span>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-7 gap-1.5 text-xs'
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip size={12} /> Attach
                      </Button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type='file'
                      multiple
                      className='hidden'
                      onChange={(e) => {
                        handleFileSelect(e.target.files);
                        e.target.value = '';
                      }}
                    />

                    {attachments.length === 0 ? (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setFileDragOver(true);
                        }}
                        onDragLeave={(e) => {
                          e.stopPropagation();
                          setFileDragOver(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setFileDragOver(false);
                          handleFileSelect(e.dataTransfer.files);
                        }}
                        className={cn(
                          'rounded-lg border-2 border-dashed p-5 text-center text-xs text-muted-foreground transition-colors',
                          fileDragOver ? 'border-primary bg-primary/5' : 'border-border'
                        )}
                      >
                        Drop files here or click Attach
                      </div>
                    ) : (
                      <div className='space-y-2'>
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFileDragOver(true);
                          }}
                          onDragLeave={(e) => {
                            e.stopPropagation();
                            setFileDragOver(false);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFileDragOver(false);
                            handleFileSelect(e.dataTransfer.files);
                          }}
                          className={cn(
                            'rounded-md border border-dashed p-2 text-center text-[10px] text-muted-foreground transition-colors',
                            fileDragOver ? 'border-primary bg-primary/5' : 'border-border/60'
                          )}
                        >
                          Drop more files here
                        </div>
                        {attachments.map((file) => (
                          <div
                            key={file.id}
                            className='flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2'
                          >
                            <Paperclip size={12} className='shrink-0 text-muted-foreground' />
                            <span className='flex-1 truncate text-xs'>{file.name}</span>
                            <span className='shrink-0 text-[10px] text-muted-foreground'>
                              {formatFileSize(file.size)}
                            </span>
                            <button
                              onClick={() => removeAttachment(file.id)}
                              className='shrink-0 text-muted-foreground hover:text-foreground'
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right column — Activity */}
                <div className='flex h-[42dvh] flex-col bg-muted/20 lg:h-auto lg:w-[360px]'>
                  <div className='border-b border-border px-4 py-3'>
                    <h4 className='text-sm font-semibold'>Activity</h4>
                  </div>

                  <ScrollArea className='flex-1 px-4 py-3'>
                    <div className='space-y-4'>
                      {activitiesLoading ? (
                        <div className='flex items-center justify-center py-8'>
                          <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
                        </div>
                      ) : activities.length === 0 ? (
                        <p className='py-8 text-center text-xs text-muted-foreground'>
                          No activity yet.
                        </p>
                      ) : (
                        activities.map((activity) => (
                          <div key={activity._id} className='flex items-start gap-3'>
                            <Avatar className='mt-0.5 h-7 w-7 shrink-0'>
                              <AvatarFallback className='bg-primary/20 text-[9px] font-bold text-primary'>
                                {activity.actorName
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className='min-w-0 flex-1'>
                              <div className='mb-0.5 flex items-baseline justify-between gap-2'>
                                <span className='truncate text-xs font-semibold'>
                                  {activity.actorName}
                                </span>
                                <span className='shrink-0 text-[10px] text-muted-foreground'>
                                  {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                                </span>
                              </div>
                              <p className='text-sm leading-snug text-muted-foreground'>
                                {activity.type === 'comment_added'
                                  ? activity.metadata?.content ?? activity.description
                                  : activity.description}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>

                  {/* Comment input */}
                  <div className='border-t border-border p-3'>
                    <div className='flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2'>
                      <Input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder='Write a comment...'
                        className='h-auto border-none bg-transparent p-2 text-sm shadow-none focus-visible:ring-0'
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                      />
                      <Button
                        size='icon'
                        className='h-7 w-7 shrink-0 rounded-full'
                        onClick={handleAddComment}
                        disabled={addCommentMutation.isPending}
                      >
                        {addCommentMutation.isPending ? (
                          <Loader2 size={12} className='animate-spin' />
                        ) : (
                          <Send size={12} />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className='flex flex-1 items-center justify-center'>
              <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksTab;
