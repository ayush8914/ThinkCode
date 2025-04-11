import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import type { Language } from '@repo/db';
import type { ExecutionResult } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execFileAsync = promisify(execFile);

export class CodeExecutor {
  private readonly workDir = '/tmp/code';
  private readonly sandboxPath: string;
  
  constructor() {
    // Get absolute path to sandbox script
    this.sandboxPath = path.join(__dirname, '..', 'scripts', 'sandbox.sh');
    console.log('Sandbox path:', this.sandboxPath);
    this.initialize();
  }
  
  private async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.workDir, { recursive: true, mode: 0o777 });
      
      try {
        await fs.access(this.sandboxPath, fs.constants.F_OK);
        await fs.chmod(this.sandboxPath, 0o755);
        console.log('✅ Sandbox script ready');
      } catch (error) {
        console.error('❌ Sandbox script not found at:', this.sandboxPath);
        throw error;
      }
    } catch (error) {
      console.error('Failed to initialize work directory:', error);
    }
  }
  
  async execute(
    code: string,
    language: Language,
    input: string,
    limits: { timeLimitMs: number; memoryLimitKb: number }
  ): Promise<ExecutionResult> {
    const runId = randomUUID();
    const extension = this.getExtension(language);
    console.log(`Language: ${language}, Extension: ${extension}`);
    
    const codeFile = path.join(this.workDir, `${runId}.${extension}`);
    const inputFile = path.join(this.workDir, `${runId}.in`);
    
    console.log(`Code file: ${codeFile}`);
    
    try {
      await fs.writeFile(codeFile, code, { mode: 0o644 });
      await fs.writeFile(inputFile, input, { mode: 0o644 });
      
      console.log(`Executing: ${language} code with ${limits.timeLimitMs}ms timeout`);
      
      const { stdout, stderr } = await execFileAsync(
        this.sandboxPath,
        [
          language,
          codeFile,
          inputFile,
          limits.timeLimitMs.toString(),
          limits.memoryLimitKb.toString()
        ],
        {
          timeout: limits.timeLimitMs + 5000, 
          maxBuffer: 10 * 1024 * 1024, 
          env: {
            ...process.env,
            PATH: '/usr/local/bin:/usr/bin:/bin',
          },
        }
      );
      
      return this.parseSandboxOutput(stdout, stderr);
      
    } catch (error: any) {
      console.error(`Execution error for ${runId}:`, error.message);
      
      if (error.killed || error.code === 'ETIMEDOUT') {
        return {
          status: 'TIME_LIMIT_EXCEEDED',
          errorMessage: 'Execution timed out',
        };
      }
      
      if (error.code === 'ENOENT') {
        return {
          status: 'INTERNAL_ERROR',
          errorMessage: `Sandbox script not found: ${this.sandboxPath}`,
        };
      }
      
      if (error.code === 'EPERM' || error.code === 'EACCES') {
        return {
          status: 'INTERNAL_ERROR',
          errorMessage: `Permission denied executing sandbox: ${error.message}`,
        };
      }
      
      return {
        status: 'RUNTIME_ERROR',
        errorMessage: error.message || 'Unknown execution error',
      };
      
    } finally {
      await this.cleanup([codeFile, inputFile]);
    }
  }
  
  private parseSandboxOutput(stdout: string, stderr: string): ExecutionResult {
    console.log('Sandbox stdout:', stdout.substring(0, 200));
    if (stderr) {
      console.log('Sandbox stderr:', stderr.substring(0, 200));
    }
    
    const lines = stdout.trim().split('\n');
    const statusLine = lines[0] || '';
    
    // Parse metadata
    let timeMs = 0;
    let memoryKb = 0;
    let output = '';
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i] || '';
      if (line.startsWith('TIME:')) {
        timeMs = parseInt(line.substring(5)) || 0;
      } else if (line.startsWith('MEMORY:')) {
        memoryKb = parseInt(line.substring(7)) || 0;
      } else {
        output += line + '\n';
      }
    }
    
    output = output.trim();
    
    switch (statusLine) {
      case 'SUCCESS':
        return {
          status: 'ACCEPTED',
          executionTimeMs: timeMs,
          memoryUsedKb: memoryKb,
          output,
        };
        
      case 'COMPILATION_ERROR':
        return {
          status: 'COMPILATION_ERROR',
          errorMessage: output || stderr || 'Compilation failed',
        };
        
      case 'TIME_LIMIT_EXCEEDED':
        return {
          status: 'TIME_LIMIT_EXCEEDED',
          executionTimeMs: timeMs,
          memoryUsedKb: memoryKb,
          errorMessage: `Time limit exceeded (${timeMs}ms)`,
        };
        
      case 'MEMORY_LIMIT_EXCEEDED':
        return {
          status: 'MEMORY_LIMIT_EXCEEDED',
          executionTimeMs: timeMs,
          memoryUsedKb: memoryKb,
          errorMessage: `Memory limit exceeded (${memoryKb}KB)`,
        };
        
      case 'RUNTIME_ERROR':
        return {
          status: 'RUNTIME_ERROR',
          executionTimeMs: timeMs,
          memoryUsedKb: memoryKb,
          errorMessage: output || stderr || 'Runtime error',
        };
        
      default:
        if (output && !stderr) {
          return {
            status: 'ACCEPTED',
            output,
            executionTimeMs: timeMs,
            memoryUsedKb: memoryKb,
          };
        }
        
        return {
          status: 'INTERNAL_ERROR',
          errorMessage: `Unknown status: ${statusLine}\nStdout: ${stdout}\nStderr: ${stderr}`,
        };
    }
  }
  
  private getExtension(language: Language): string {
    const extensions: Record<string, string> = {
      PYTHON: 'py',
      CPP: 'cpp',
      JAVA: 'java',
      JS: 'js',        
      JAVASCRIPT: 'js', 
      C: 'c',         
    };
    return extensions[language] || 'txt';
  }
  
  private async cleanup(files: string[]): Promise<void> {
    for (const file of files) {
      try {
        await fs.unlink(file);
      } catch (error) {
      }
    }
  }
}