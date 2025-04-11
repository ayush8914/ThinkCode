import {prisma} from '@repo/db';

async function main() {
  console.log('🌱 Starting seed...');
  
  try {
    const user = await prisma.user.upsert({
      where: { email: 'test@thinkcode.com' },
      update: {},
      create: {
        email: 'test@thinkcode.com',
        passwordHash: 'test123',
        name: 'Test User',
        role: 'USER',
      },
    });
    console.log('✅ User:', user.id);

    const problem = await prisma.problem.upsert({
      where: { slug: 'two-sum' },
      update: {},
      create: {
        title: 'Two Sum',
        slug: 'two-sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        difficulty: 'EASY',
        timeLimitMs: 1000,
        memoryLimitKb: 262144,
        isPublic: true,
      },
    });
    console.log('✅ Problem:', problem.id);

    const testCase = await prisma.testCase.create({
      data: {
        problemId: problem.id,
        input: '2 7 11 15\n9',
        output: '0 1',
        isSample: true,
        orderIndex: 0,
      },
    });
    console.log('✅ Test case created');

    console.log('\n📋 Test Data:');
    console.log(`User ID: ${user.id}`);
    console.log(`Problem ID: ${problem.id}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();