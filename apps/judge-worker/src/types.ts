import type { Language, Status } from '@repo/db';

export interface JudgeTask {
  submissionId: string;
  problemId: string;
  userId: string;
  code: string;
  language: Language;
  timestamp: number;
}

export interface TestCase {
  id: string;
  input: string;
  output: string;
  isSample: boolean;
  orderIndex: number;
}

export interface ExecutionResult {
  status: Status;
  executionTimeMs?: number;
  memoryUsedKb?: number;
  errorMessage?: string;
  failedTestCaseIndex?: number;
  output?: string;
}

export interface CompilationResult {
  success: boolean;
  error?: string;
  executablePath?: string;
}

export interface SandboxResult {
  status: 'SUCCESS' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR';
  timeMs: number;
  memoryKb: number;
  output: string;
  error: string;
}