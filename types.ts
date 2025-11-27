export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  isStreaming?: boolean;
  groundingChunks?: GroundingChunk[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastModified: number;
}

// --- Mock Test Interfaces ---

export interface MockQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number; // 0-3
  rationale: string;
  subject: string; // e.g., "Constitutional Law", "IPC"
}

export interface SubjectPerformance {
  subject: string;
  total: number;
  correct: number;
}

export interface MockTestResult {
  totalQuestions: number;
  score: number;
  percentage: number;
  subjectBreakdown: SubjectPerformance[];
  feedback: string;
}