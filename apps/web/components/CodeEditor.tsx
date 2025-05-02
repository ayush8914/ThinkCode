'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Monaco from '@monaco-editor/react';
import { Play, Loader2, CheckCircle2, XCircle, Clock, AlertTriangle, Lock, ChevronUp, ChevronDown } from 'lucide-react';
import { getBoilerplate } from '@/lib/boilerplates';

const LANGUAGES = [
  { value: 'cpp', label: 'C++', monaco: 'cpp' },
  { value: 'c', label: 'C', monaco: 'c' },
  { value: 'python', label: 'Python 3', monaco: 'python' },
  { value: 'javascript', label: 'JavaScript', monaco: 'javascript' },
];

const LANGUAGE_MAP: Record<string, string> = {
  cpp: 'CPP',
  c: 'C',
  python: 'PYTHON',
  javascript: 'JS',
};

interface CodeEditorProps {
  problemId: string;
  contestId?: string;
  isContest?: boolean;
  isEnded?: boolean;
}

export default function CodeEditor({ 
  problemId, 
  contestId, 
  isContest = false, 
  isEnded = false 
}: CodeEditorProps) {
  const { data: session } = useSession();
  const [code, setCode] = useState(() => getBoilerplate('CPP'));
  const [language, setLanguage] = useState('cpp');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [fontSize, setFontSize] = useState(14);
  const [isPolling, setIsPolling] = useState(false);
  const [editorHeight, setEditorHeight] = useState('100%');
  const containerRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!session;
  const canSubmit = !isContest || !isEnded;
  const isDisabled = submitting || isPolling || !canSubmit;
  const showResultPanel = result && isLoggedIn;

  useEffect(() => {
    if (showResultPanel) {
      setEditorHeight('50%');
    } else {
      setEditorHeight('100%');
    }
  }, [showResultPanel]);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode(getBoilerplate(LANGUAGE_MAP[newLanguage]));
  };

  const handleSubmit = async () => {
    const userId = session?.user?.id;
    
    if (!userId) {
      alert('Please sign in to submit code');
      return;
    }

    setSubmitting(true);
    setIsPolling(true);
    setResult(null);
    setEditorHeight('50%');

    try {
      const body: any = {
        userId,
        problemId,
        code,
        language: LANGUAGE_MAP[language],
      };
      
      if (isContest && contestId) {
        body.contestId = contestId;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_JUDGE_API_URL}/api/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          status: 'PENDING',
          submissionId: data.data.submissionId,
        });
        await pollSubmissionStatus(data.data.submissionId);
      } else {
        setResult({
          status: 'ERROR',
          message: data.error || 'Submission failed',
        });
        setSubmitting(false);
        setIsPolling(false);
      }
    } catch (error) {
      setResult({
        status: 'ERROR',
        message: 'Failed to connect to server',
      });
      setSubmitting(false);
      setIsPolling(false);
    }
  };

  const pollSubmissionStatus = async (submissionId: string) => {
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 1000));
      
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_JUDGE_API_URL}/api/submission/${submissionId}`);
        const data = await res.json();

        if (data.success) {
          setResult({
            status: data.data.status,
            executionTimeMs: data.data.executionTimeMs,
            memoryUsedKb: data.data.memoryUsedKb,
            errorMessage: data.data.errorMessage,
            failedTestCaseIndex: data.data.failedTestCaseIndex,
          });

          if (data.data.status !== 'PENDING' && data.data.status !== 'PROCESSING') {
            setSubmitting(false);
            setIsPolling(false);
            break;
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }
  };

  const handleCloseResult = () => {
    setResult(null);
    setEditorHeight('100%');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
      case 'WRONG_ANSWER':
        return <XCircle className="h-5 w-5 text-rose-400" />;
      case 'TIME_LIMIT_EXCEEDED':
        return <Clock className="h-5 w-5 text-amber-400" />;
      case 'COMPILATION_ERROR':
      case 'RUNTIME_ERROR':
        return <AlertTriangle className="h-5 w-5 text-rose-400" />;
      case 'PENDING':
      case 'PROCESSING':
        return <Loader2 className="h-5 w-5 text-violet-400 animate-spin" />;
      default:
        return <XCircle className="h-5 w-5 text-rose-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'border-emerald-500/30 bg-emerald-500/5';
      case 'WRONG_ANSWER':
      case 'COMPILATION_ERROR':
      case 'RUNTIME_ERROR':
        return 'border-rose-500/30 bg-rose-500/5';
      case 'TIME_LIMIT_EXCEEDED':
        return 'border-amber-500/30 bg-amber-500/5';
      default:
        return 'border-violet-500/30 bg-violet-500/5';
    }
  };

  return (
    <div ref={containerRef} className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={!isLoggedIn || isDisabled}
            className={`px-3 py-1.5 rounded-md text-sm bg-white/5 border border-white/10 font-mono transition-colors ${
              isLoggedIn && !isDisabled
                ? 'text-white/80 cursor-pointer hover:bg-white/10' 
                : 'text-white/30 cursor-not-allowed'
            }`}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value} className="bg-[#06060e]">
                {lang.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFontSize(f => Math.max(10, f - 2))}
              disabled={!isLoggedIn || isDisabled}
              className={`px-2 py-1 transition-colors ${
                isLoggedIn && !isDisabled ? 'text-white/40 hover:text-white/70' : 'text-white/20 cursor-not-allowed'
              }`}
            >
              A-
            </button>
            <span className={`text-sm ${isLoggedIn ? 'text-white/40' : 'text-white/20'}`}>{fontSize}px</span>
            <button
              onClick={() => setFontSize(f => Math.min(20, f + 2))}
              disabled={!isLoggedIn || isDisabled}
              className={`px-2 py-1 transition-colors ${
                isLoggedIn && !isDisabled ? 'text-white/40 hover:text-white/70' : 'text-white/20 cursor-not-allowed'
              }`}
            >
              A+
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isDisabled || !isLoggedIn}
          className="flex items-center gap-2 px-6 py-1.5 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: isLoggedIn && !isDisabled
              ? 'linear-gradient(135deg, #5b21b6, #1d4ed8)' 
              : 'rgba(255,255,255,0.05)',
            border: isLoggedIn && !isDisabled ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.1)',
            color: isLoggedIn && !isDisabled ? 'white' : 'rgba(255,255,255,0.4)',
            boxShadow: isLoggedIn && !isDisabled ? '0 0 20px rgba(124,58,237,0.25)' : 'none',
          }}
        >
          {isDisabled ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isPolling ? 'Judging...' : isEnded ? 'Contest Ended' : 'Running...'}
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Submit
            </>
          )}
        </button>
      </div>

      {/* Monaco Editor */}
      <div style={{ height: editorHeight }} className="overflow-hidden relative transition-all duration-300">
        <Monaco
          height="100%"
          language={LANGUAGES.find(l => l.value === language)?.monaco || 'cpp'}
          value={code}
          onChange={(value) => setCode(value || '')}
          theme="vs-dark"
          options={{
            fontSize,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            renderLineHighlight: 'all',
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              useShadows: false,
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            readOnly: !isLoggedIn || isDisabled,
          }}
          beforeMount={(monaco) => {
            monaco.editor.defineTheme('vs-dark', {
              base: 'vs-dark',
              inherit: true,
              rules: [],
              colors: {
                'editor.background': '#0a0a0f',
                'editor.foreground': '#e4e4e7',
                'editor.lineHighlightBackground': '#1a1a2e10',
                'editorLineNumber.foreground': '#52525b',
                'editorLineNumber.activeForeground': '#a1a1aa',
              },
            });
          }}
        />
        
        {!isLoggedIn && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
            <div className="text-center">
              <Lock className="h-8 w-8 text-white/40 mx-auto mb-3" />
              <p className="text-white/60 text-sm font-medium">Sign in to write code</p>
              <a 
                href="/auth/signin" 
                className="mt-2 inline-block px-4 py-1.5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-md transition-colors"
              >
                Sign In
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Result Panel */}
      {showResultPanel && (
        <div className={`border-t ${getStatusColor(result.status)}`} style={{ height: '50%', overflow: 'auto' }}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
            <div className="flex items-center gap-3">
              {getStatusIcon(result.status)}
              <span className="font-semibold text-white">{result.status}</span>
              {result.executionTimeMs !== undefined && result.executionTimeMs !== null && (
                <>
                  <span className="text-white/20">•</span>
                  <span className="text-white/50 text-sm">{result.executionTimeMs}ms</span>
                </>
              )}
              {result.memoryUsedKb !== undefined && result.memoryUsedKb !== null && result.memoryUsedKb > 0 && (
                <>
                  <span className="text-white/20">•</span>
                  <span className="text-white/50 text-sm">{Math.round(result.memoryUsedKb / 1024)}MB</span>
                </>
              )}
            </div>
            <button
              onClick={handleCloseResult}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <ChevronDown className="h-4 w-4 text-white/60" />
            </button>
          </div>
          <div className="p-4">
            {result.errorMessage && (
              <p className="text-sm text-rose-400/80 font-mono whitespace-pre-wrap">{result.errorMessage}</p>
            )}
            {result.failedTestCaseIndex !== undefined && result.failedTestCaseIndex !== null && result.failedTestCaseIndex >= 0 && (
              <p className="text-sm text-white/50">
                Failed at test case #{result.failedTestCaseIndex + 1}
              </p>
            )}
            {result.status === 'PENDING' || result.status === 'PROCESSING' ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
                <span className="ml-3 text-white/60">Running your code...</span>
              </div>
            ) : result.status === 'ACCEPTED' ? (
              <div className="py-4 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-2" />
                <p className="text-emerald-400 font-medium">All test cases passed!</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {!isLoggedIn && (
        <div className="border-t border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-sm text-amber-400/80">
            ⚠️ You're not signed in. Sign in to write and submit code.
            <a href="/auth/signin" className="ml-1 font-medium underline hover:text-amber-300">
              Sign in
            </a>
          </p>
        </div>
      )}
    </div>
  );
}