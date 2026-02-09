export interface ActionResult {
  action: string;
  success: boolean;
  rejected?: boolean;
  rejectionReason?: string;
  output?: string;
  error?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'result' | 'executing';
  content: string;
  results?: ActionResult[];
  executingAction?: string;
  executingOutput?: string;
}

export interface ChatSession {
  id: string;
  name: string;
}

export type Tier = 'free' | 'plus' | 'pro';

export interface UsageItem {
  category: 'basic' | 'premium';
  limit: number;
  used: number;
  remaining: number;
  periodStart: string;
  periodEnd: string;
}

export interface UsageData {
  tier: Tier;
  planId: string | null;
  status: 'active' | 'trialing' | 'canceled' | null;
  periodEnd: string | null;
  maxModeEnabled: boolean;
  maxModeEligible: boolean;
  usage: UsageItem[];
}

export interface AppState {
  messages: ChatMessage[];
  sessions: ChatSession[];
  currentSessionId: string;
  agentMode: boolean;
  approvalMode: string;
  isLoading: boolean;
  agentRunning: boolean;
  usageData: UsageData | null;
  isLoggedIn: boolean;
}

export type ModelTierRequirement = 'free' | 'plus' | 'pro';

export const PLUS_MODELS = ['anthropic/claude-sonnet-4.5'];

export const PRO_MODELS = [
  'anthropic/claude-opus-4.5',
  'anthropic/claude-opus-4.6',
  'google/gemini-3-pro-preview',
];

export function getModelTierRequirement(model: string): ModelTierRequirement {
  if (PRO_MODELS.includes(model)) {
    return 'pro';
  }
  if (PLUS_MODELS.includes(model)) {
    return 'plus';
  }
  return 'free';
}

export function canUseTier(userTier: Tier | null, requiredTier: ModelTierRequirement): boolean {
  if (!userTier) {
    return false;
  }
  if (requiredTier === 'free') {
    return true;
  }
  if (requiredTier === 'plus') {
    return userTier === 'plus' || userTier === 'pro';
  }
  if (requiredTier === 'pro') {
    return userTier === 'pro';
  }
  return false;
}
