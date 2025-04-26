import { prisma } from '@repo/db';

export async function trackSubmissionActivity(
  userId: string, 
  status: string
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const updateData: any = {
    submissions: { increment: 1 },
  };
  
  if (status === 'ACCEPTED') {
    updateData.accepted = { increment: 1 };
  } else if (status === 'WRONG_ANSWER') {
    updateData.wrongAnswer = { increment: 1 };
  } else if (status === 'TIME_LIMIT_EXCEEDED') {
    updateData.timeLimit = { increment: 1 };
  } else if (status === 'RUNTIME_ERROR') {
    updateData.runtimeError = { increment: 1 };
  } else if (status === 'COMPILATION_ERROR') {
    updateData.compilationError = { increment: 1 };
  }
  
  await prisma.userActivity.upsert({
    where: {
      userId_date: { userId, date: today },
    },
    update: updateData,
    create: {
      userId,
      date: today,
      submissions: 1,
      accepted: status === 'ACCEPTED' ? 1 : 0,
      wrongAnswer: status === 'WRONG_ANSWER' ? 1 : 0,
      timeLimit: status === 'TIME_LIMIT_EXCEEDED' ? 1 : 0,
      runtimeError: status === 'RUNTIME_ERROR' ? 1 : 0,
      compilationError: status === 'COMPILATION_ERROR' ? 1 : 0,
    },
  });
}