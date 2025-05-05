import { z } from 'zod';
import type { Language, Status } from '@repo/db';

export const SubmitCodeSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  problemId: z.string().min(1, 'Problem ID is required'),
  code: z.string().min(1, 'Code is required'),
  language: z.enum(['PYTHON', 'CPP', 'C', 'JS']),
});

export type SubmitCodeRequest = z.infer<typeof SubmitCodeSchema>;

export interface JudgeTask {
  submissionId: string;
  problemId: string;
  userId: string;
  code: string;
  language: Language;
  timestamp: number;
  contestId?: string | null;
}

export interface SubmissionResult {
  submissionId: string;
  status: Status;
  executionTimeMs?: number;
  memoryUsedKb?: number;
  errorMessage?: string;
  failedTestCaseIndex?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}