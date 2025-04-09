import { prisma } from '@repo/db';
import { notFound } from 'next/navigation';
import CodeEditor from '../../../../src/components/CodeEditor';

interface ProblemPageProps {
  params: {
    slug: string;
  };
}

export default async function ProblemPage({ params }: ProblemPageProps) {
  const problem = await prisma.problem.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      title: true,
      description: true,
      difficulty: true,
      timeLimitMs: true,
      memoryLimitKb: true,
      tags: {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      testCases: {
        where: { isSample: true },
        select: {
          id: true,
          input: true,
          output: true,
          explanation: true,
        },
        orderBy: { orderIndex: 'asc' },
      },
    },
  });
  
  if (!problem) {
    notFound();
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{problem.title}</h1>
          <div className="flex gap-2 items-center">
            <span className={`px-3 py-1 rounded-full text-sm font-medium
              ${problem.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                problem.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'}`}>
              {problem.difficulty}
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-600">
              Time Limit: {problem.timeLimitMs}ms
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-600">
              Memory: {Math.round(problem.memoryLimitKb / 1024)}MB
            </span>
          </div>
          <div className="flex gap-2 mt-2">
            {problem.tags.map(({ tag }) => (
              <span key={tag.id} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                {tag.name}
              </span>
            ))}
          </div>
        </div>
        
        <div className="prose prose-lg max-w-none mb-8">
          <div dangerouslySetInnerHTML={{ __html: problem.description }} />
        </div>
        
        {problem.testCases.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Examples</h2>
            {problem.testCases.map((testCase, index) => (
              <div key={testCase.id} className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="font-medium mb-2">Example {index + 1}:</p>
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-600">Input:</span>
                  <pre className="mt-1 p-2 bg-gray-100 rounded">{testCase.input}</pre>
                </div>
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-600">Output:</span>
                  <pre className="mt-1 p-2 bg-gray-100 rounded">{testCase.output}</pre>
                </div>
                {testCase.explanation && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Explanation:</span>
                    <p className="mt-1 text-gray-700">{testCase.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <CodeEditor problemId={problem.id} />
      </div>
    </div>
  );
}