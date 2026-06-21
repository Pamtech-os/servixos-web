import { protectedGet, protectedRequest } from './core';
import type { PaginationMeta } from '@/lib/pagination';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskStage = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskActivityType =
  | 'task_created'
  | 'task_updated'
  | 'task_deleted'
  | 'comment_added'
  | 'subtask_added'
  | 'subtask_updated';

export interface TaskSubtask {
  _id: string;
  title: string;
  completed: boolean;
}

export interface TaskComment {
  _id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Task {
  _id: string;
  businessId: string;
  assigneeId?: string | { _id: string; fullName: string };
  title: string;
  description?: string;
  stage: TaskStage;
  priority?: TaskPriority;
  dueDate?: string;
  subtasks: TaskSubtask[];
  comments: TaskComment[];
  deletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskActivity {
  _id: string;
  businessId: string;
  taskId: string;
  actorId: string;
  actorName: string;
  type: TaskActivityType;
  description: string;
  metadata?: {
    stage?: TaskStage;
    assigneeId?: string;
    updatedFields?: string[];
    content?: string;
    subtaskId?: string;
    completed?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TasksQuery {
  assigneeId?: string;
  stage?: TaskStage;
  priority?: TaskPriority;
  dueDate?: string;
  page?: number;
  limit?: number;
}

export interface TaskActivitiesQuery {
  page?: number;
  limit?: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  assigneeId?: string;
  stage: TaskStage;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  stage?: TaskStage;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const tasks = {
  list: async (
    businessId: string,
    query: TasksQuery = {}
  ): Promise<{ data: Task[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    if (query.assigneeId) params.set('assigneeId', query.assigneeId);
    if (query.stage) params.set('stage', query.stage);
    if (query.priority) params.set('priority', query.priority);
    if (query.dueDate) params.set('dueDate', query.dueDate);
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/tasks${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<Task[]>(path, businessId);
    return { data: envelope.data, meta: envelope.meta! };
  },

  get: async (businessId: string, id: string): Promise<Task> => {
    const envelope = await protectedGet<Task>(`/tasks/${id}`, businessId);
    return envelope.data;
  },

  getActivities: async (
    businessId: string,
    id: string,
    query: TaskActivitiesQuery = {}
  ): Promise<{ data: TaskActivity[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/tasks/${id}/activities${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<TaskActivity[]>(path, businessId);
    return { data: envelope.data, meta: envelope.meta! };
  },

  create: (businessId: string, input: CreateTaskInput): Promise<Task> =>
    protectedRequest<Task>('POST', '/tasks', businessId, input),

  update: (businessId: string, id: string, input: UpdateTaskInput): Promise<Task> =>
    protectedRequest<Task>('PATCH', `/tasks/${id}`, businessId, input),

  delete: (businessId: string, id: string): Promise<null> =>
    protectedRequest<null>('DELETE', `/tasks/${id}`, businessId),

  addComment: (businessId: string, id: string, content: string): Promise<Task> =>
    protectedRequest<Task>('POST', `/tasks/${id}/comments`, businessId, { content }),

  addSubtask: (businessId: string, id: string, title: string): Promise<Task> =>
    protectedRequest<Task>('POST', `/tasks/${id}/subtasks`, businessId, { title }),

  toggleSubtask: (
    businessId: string,
    id: string,
    subtaskId: string,
    completed: boolean
  ): Promise<Task> =>
    protectedRequest<Task>('PATCH', `/tasks/${id}/subtasks/${subtaskId}`, businessId, {
      completed,
    }),
};
