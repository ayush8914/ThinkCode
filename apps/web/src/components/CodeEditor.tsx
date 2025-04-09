'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CodeEditorProps {
  problemId: string;
}

const LANGUAGES = [
  { value: 'PYTHON', label: 'Python 3' },
  { value: 'CPP', label: 'C++' },
  { value: 'JAVA', label: 'Java' },
];

export default function CodeEditor({ problemId }: CodeEditorProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('PYTHON');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const handleSubmit = async () => {
    if (!code.trim()) {
      alert('Please write some code first');
      return;
    }
    
    setSubmitting(true);
    setResult(null);
    
    try {
      // TODO: Get actual user ID from auth
      const userId = 'temp-user-id';
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_JUDGE_API_URL}/api/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          problemId,
          code,
          language,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult({
          type: 'success',
          message: 'Submission queued!',
          submissionId: data.data.submissionId,
        });
        
        // Poll for results
        pollSubmissionStatus(data.data.submissionId);
      } else {
        setResult({
          type: 'error',
          message: data.error || 'Submission failed',
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Failed to submit code',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const pollSubmissionStatus = async (submissionId: string) => {
    const maxAttempts = 30;
    let attempts = 0;
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_JUDGE_API_URL}/api/submission/${submissionId}`);
        const data = await response.json();
        
        if (data.success && data.data.status !== 'PENDING' && data.data.status !== 'PROCESSING') {
          setResult({
            type: data.data.status === 'ACCEPTED' ? 'success' : 'error',
            message: `Status: ${data.data.status}`,
            details: data.data,
          });
          router.refresh();
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 2000);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };
    
    setTimeout(checkStatus, 2000);
  };
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-3 py-1 border rounded"
        >
          {LANGUAGES.map(lang => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
        
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`px-4 py-2 rounded font-medium ${
            submitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {submitting ? 'Submitting...' : 'Submit Code'}
        </button>
      </div>
      
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Write your code here..."
        className="w-full h-96 p-4 font-mono text-sm focus:outline-none"
        spellCheck={false}
      />
      
      {result && (
        <div className={`p-4 border-t ${
          result.type === 'success' ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <p className={`font-medium ${
            result.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {result.message}
          </p>
          {result.details && (
            <div className="mt-2 text-sm">
              <p>Time: {result.details.executionTimeMs}ms</p>
              <p>Memory: {Math.round((result.details.memoryUsedKb || 0) / 1024)}MB</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}