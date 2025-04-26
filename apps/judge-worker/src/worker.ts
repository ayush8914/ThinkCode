import { Redis } from 'ioredis';
import { prisma, type Status } from '@repo/db';
import { CodeExecutor } from './executor.js';
import type { JudgeTask, TestCase } from './types.js';
import * as os from 'os';
import { trackSubmissionActivity } from './activity.js';

class JudgeWorker {
  private redis: Redis;
  private executor: CodeExecutor;
  private isRunning = true;
  private workerId: string;
  private concurrentExecutions = 0;
  private maxConcurrent = parseInt(process.env.MAX_CONCURRENT_EXECUTIONS || '3');
  
  constructor() {
    this.workerId = `${os.hostname()}-${process.pid}`;
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'redis.thinkcode.svc.cluster.local',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
    
    this.executor = new CodeExecutor();
    this.setupEventHandlers();
  }
  
  private setupEventHandlers(): void {
    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
    
    this.redis.on('connect', () => {
      console.log(`✅ Worker ${this.workerId} connected to Redis`);
    });
    
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }
  
  async processSubmission(task: JudgeTask): Promise<void> {
    const startTime = Date.now();
    this.concurrentExecutions++;
    
    console.log(`📝 [${this.workerId}] Processing submission ${task.submissionId} (concurrent: ${this.concurrentExecutions})`);
    
    try {
      await prisma.submission.update({
        where: { id: task.submissionId },
        data: { 
          status: 'PROCESSING',
        },
      });
      
      const problem = await prisma.problem.findUnique({
        where: { id: task.problemId },
        include: {
          testCases: {
            where: { isSample: false }, // Run only hidden test cases
            orderBy: { orderIndex: 'asc' },
          },
        },
      });
      
      if (!problem) {
        throw new Error(`Problem ${task.problemId} not found`);
      }
      
      if (problem.testCases.length === 0) {
        throw new Error(`No test cases found for problem ${task.problemId}`);
      }
      
      console.log(`🧪 [${this.workerId}] Running ${problem.testCases.length} test cases`);
      
      const result = await this.runTestCases(
        task,
        problem.testCases,
        {
          timeLimitMs: problem.timeLimitMs,
          memoryLimitKb: problem.memoryLimitKb,
        }
      );
      
      await prisma.submission.update({
        where: { id: task.submissionId },
        data: {
          status: result.status,
          executionTimeMs: result.executionTimeMs,
          memoryUsedKb: result.memoryUsedKb,
          errorMessage: result.errorMessage,
          failedTestCaseIndex: result.failedTestCaseIndex,
          judgedAt: new Date(),
        },
      });
      
       await trackSubmissionActivity(task.userId, result.status);


      await this.redis.publish(
        `user:${task.userId}:submissions`,
        JSON.stringify({
          submissionId: task.submissionId,
          status: result.status,
          executionTimeMs: result.executionTimeMs,
          memoryUsedKb: result.memoryUsedKb,
        })
      );
      
      const duration = Date.now() - startTime;
      console.log(`✅ [${this.workerId}] Submission ${task.submissionId} completed: ${result.status} (${duration}ms)`);
      
    } catch (error) {
      console.error(`❌ [${this.workerId}] Error processing ${task.submissionId}:`, error);
      
      await prisma.submission.update({
        where: { id: task.submissionId },
        data: {
          status: 'INTERNAL_ERROR',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          judgedAt: new Date(),
        },
      });
      
    } finally {
      this.concurrentExecutions--;
    }
  }
  
  private async runTestCases(
    task: JudgeTask,
    testCases: TestCase[],
    limits: { timeLimitMs: number; memoryLimitKb: number }
  ): Promise<{
    status: Status;
    executionTimeMs?: number;
    memoryUsedKb?: number;
    errorMessage?: string;
    failedTestCaseIndex?: number;
  }> {
    let maxTime = 0;
    let maxMemory = 0;
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i] as TestCase;
      
      console.log(`  🔍 [${this.workerId}] Test case ${i + 1}/${testCases.length}`);
      
      const result = await this.executor.execute(
        task.code,
        task.language,
        testCase.input,
        limits
      );
      
      if (result.executionTimeMs) {
        maxTime = Math.max(maxTime, result.executionTimeMs);
      }
      if (result.memoryUsedKb) {
        maxMemory = Math.max(maxMemory, result.memoryUsedKb);
      }
      
      if (result.status !== 'ACCEPTED') {
        return {
          status: result.status,
          executionTimeMs: maxTime,
          memoryUsedKb: maxMemory,
          errorMessage: result.errorMessage,
          failedTestCaseIndex: i,
        };
      }
      
      const expectedOutput = testCase.output.trim();
      const actualOutput = result.output?.trim() || '';
      
      if (actualOutput !== expectedOutput) {
        console.log(`  ❌ [${this.workerId}] Wrong answer on test case ${i + 1}`);
        console.log(`     Expected: ${expectedOutput.substring(0, 100)}`);
        console.log(`     Got: ${actualOutput.substring(0, 100)}`);
        
        return {
          status: 'WRONG_ANSWER',
          executionTimeMs: maxTime,
          memoryUsedKb: maxMemory,
          failedTestCaseIndex: i,
        };
      }
      
      console.log(`  ✅ [${this.workerId}] Test case ${i + 1} passed`);
    }
    
    return {
      status: 'ACCEPTED',
      executionTimeMs: maxTime,
      memoryUsedKb: maxMemory,
    };
  }
  
  async start(): Promise<void> {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║     🚀 Judge Worker Started                              ║
╠══════════════════════════════════════════════════════════╣
║  Worker ID: ${this.workerId.padEnd(40)}║
║  Max Concurrent: ${this.maxConcurrent.toString().padEnd(38)}║
║  CPU Cores: ${os.cpus().length.toString().padEnd(40)}║
║  Total Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB${' '.repeat(34)}║
╚══════════════════════════════════════════════════════════╝
    `);
    
    while (this.isRunning) {
      try {
        if (this.concurrentExecutions < this.maxConcurrent) {
          const result = await this.redis.brpop('judge:queue', 1); // 1 second timeout
          
          if (result) {
            const [, taskJson] = result;
            const task: JudgeTask = JSON.parse(taskJson);
            
            this.processSubmission(task).catch(error => {
              console.error(`Unhandled error in submission ${task.submissionId}:`, error);
            });
          }
        } else {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error('Worker loop error:', error);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  async shutdown(): Promise<void> {
    console.log(`\n🛑 [${this.workerId}] Shutting down gracefully...`);
    this.isRunning = false;
    
    let waitTime = 0;
    while (this.concurrentExecutions > 0 && waitTime < 30000) {
      console.log(`  Waiting for ${this.concurrentExecutions} executions to complete...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      waitTime += 1000;
    }
    
    await this.redis.quit();
    await prisma.$disconnect();
    
    console.log(`👋 [${this.workerId}] Worker shut down`);
    process.exit(0);
  }
}

const worker = new JudgeWorker();
worker.start().catch(console.error);