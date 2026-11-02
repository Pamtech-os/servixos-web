import { protectedGet, protectedRequest } from './core';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GuidanceStage = 'first_customers' | 'convert_inquiries' | 'deliver' | 'grow';

export type GuidanceAction =
  | 'publish_website'
  | 'view_requests'
  | 'add_client'
  | 'send_message'
  | 'update_services'
  | 'none';

export type GuidanceStepStatus = 'todo' | 'done';

export interface GuidanceStep {
  id: string;
  /** `system` steps come from your data and clear themselves; `plan` steps you mark done. */
  source: 'system' | 'plan';
  title: string;
  why: string;
  howTo: string[];
  cost: 'free' | 'low' | 'paid' | null;
  action: GuidanceAction;
  draftMessage: string | null;
  status: GuidanceStepStatus;
  taskId: string | null;
}

export interface GuidancePlan {
  status: 'generating' | 'ready' | 'failed';
  summary: string | null;
  steps: GuidanceStep[];
  generatedAt: string | null;
}

export interface GuidanceResult {
  stage: GuidanceStage;
  stageTitle: string;
  stageMessage: string;
  nextSteps: GuidanceStep[];
  plan: GuidancePlan | null;
}

export interface GuidanceTaskResult {
  stepId: string;
  taskId: string;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export const aiGuidance = {
  get: async (businessId: string): Promise<GuidanceResult> => {
    const envelope = await protectedGet<GuidanceResult>('/ai/guidance', businessId);
    return envelope.data;
  },

  regeneratePlan: (businessId: string): Promise<void> =>
    protectedRequest<void>('POST', '/ai/guidance/plan', businessId),

  updateStep: (businessId: string, stepId: string, status: GuidanceStepStatus): Promise<GuidanceStep> =>
    protectedRequest<GuidanceStep>('PATCH', `/ai/guidance/steps/${stepId}`, businessId, { status }),

  createTask: (businessId: string, stepId: string): Promise<GuidanceTaskResult> =>
    protectedRequest<GuidanceTaskResult>('POST', `/ai/guidance/steps/${stepId}/task`, businessId),
};
