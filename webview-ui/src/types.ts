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

export interface AppState {
  messages: ChatMessage[];
  sessions: ChatSession[];
  currentSessionId: string;
  agentMode: boolean;
  approvalMode: string;
  isLoading: boolean;
  agentRunning: boolean;
}
