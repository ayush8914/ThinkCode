import { prisma } from '@repo/db';

async function generateTwoSumTestCases(count: number) {
  const testCases = [];
  
  for (let i = 0; i < count; i++) {
    const size = Math.floor(Math.random() * 99) + 2;
    const nums: number[] = [];
    
    for (let j = 0; j < size; j++) {
      nums.push(Math.floor(Math.random() * 100) - 50); // Numbers between -50 and 50
    }
    
    const index1 = Math.floor(Math.random() * size);
    let index2 = Math.floor(Math.random() * size);
    while (index2 === index1) {
      index2 = Math.floor(Math.random() * size);
    }
    
    const target = nums[index1] + nums[index2];
    
    const input = `${nums.join(' ')}\n${target}`;
    const output = `${Math.min(index1, index2)} ${Math.max(index1, index2)}`;
    
    testCases.push({
      input,
      output,
      isSample: i < 3, 
      orderIndex: i,
      explanation: i < 3 ? `nums[${index1}] + nums[${index2}] = ${nums[index1]} + ${nums[index2]} = ${target}` : null,
    });
  }
  
  return testCases;
}

async function generateReverseStringTestCases(count: number) {
  const testCases = [];
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  for (let i = 0; i < count; i++) {
    const length = Math.floor(Math.random() * 20) + 3; // 3 to 22 chars
    let str = '';
    for (let j = 0; j < length; j++) {
      str += chars[Math.floor(Math.random() * chars.length)];
    }
    
    const input = str.split('').join(' ');
    const output = str.split('').reverse().join(' ');
    
    testCases.push({
      input,
      output,
      isSample: i < 3,
      orderIndex: i,
    });
  }
  
  return testCases;
}

async function main() {
  console.log('🌱 Starting bulk seed with 50+ test cases...');
  
  try {
    // Create or get user
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
    console.log('✅ User ready:', user.id);

    const tags = await Promise.all([
      prisma.tag.upsert({ where: { name: 'Array' }, update: {}, create: { name: 'Array' } }),
      prisma.tag.upsert({ where: { name: 'Hash Table' }, update: {}, create: { name: 'Hash Table' } }),
      prisma.tag.upsert({ where: { name: 'Two Pointers' }, update: {}, create: { name: 'Two Pointers' } }),
      prisma.tag.upsert({ where: { name: 'String' }, update: {}, create: { name: 'String' } }),
    ]);
    console.log('✅ Tags ready');

    console.log('\n📝 Creating Two Sum with 50 test cases...');
    const twoSum = await prisma.problem.upsert({
      where: { slug: 'two-sum' },
      update: {
        description: `# Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

## Example 1:
\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
\`\`\`

## Example 2:
\`\`\`
Input: nums = [3,2,4], target = 6
Output: [1,2]
\`\`\`

## Example 3:
\`\`\`
Input: nums = [3,3], target = 6
Output: [0,1]
\`\`\`

## Constraints:
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists.

## Follow-up:
Can you come up with an algorithm that is less than O(n²) time complexity?`,
      },
      create: {
        title: 'Two Sum',
        slug: 'two-sum',
        description: `# Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.`,
        difficulty: 'EASY',
        timeLimitMs: 1000,
        memoryLimitKb: 262144,
        isPublic: true,
      },
    });
    console.log('✅ Problem created:', twoSum.id);

    await prisma.problem.update({
      where: { id: twoSum.id },
      data: {
        tags: {
          create: [
            { tag: { connect: { id: tags[0].id } } },
            { tag: { connect: { id: tags[1].id } } },
          ],
        },
      },
    });

    await prisma.testCase.deleteMany({ where: { problemId: twoSum.id } });
    
    const twoSumTestCases = await generateTwoSumTestCases(50);
    let inserted = 0;
    
    for (const tc of twoSumTestCases) {
      await prisma.testCase.create({
        data: {
          problemId: twoSum.id,
          ...tc,
        },
      });
      inserted++;
      if (inserted % 10 === 0) {
        console.log(`  ✅ Inserted ${inserted} test cases...`);
      }
    }
    console.log(`✅ Created ${inserted} test cases for Two Sum`);

    console.log('\n📝 Creating Reverse String with 50 test cases...');
    const reverseString = await prisma.problem.upsert({
      where: { slug: 'reverse-string' },
      update: {},
      create: {
        title: 'Reverse String',
        slug: 'reverse-string',
        description: `# Reverse String

Write a function that reverses a string. The input string is given as an array of characters \`s\`.

You must do this by modifying the input array in-place with O(1) extra memory.

## Example 1:
\`\`\`
Input: s = ["h","e","l","l","o"]
Output: ["o","l","l","e","h"]
\`\`\`

## Example 2:
\`\`\`
Input: s = ["H","a","n","n","a","h"]
Output: ["h","a","n","n","a","H"]
\`\`\`

## Constraints:
- 1 <= s.length <= 10^5
- s[i] is a printable ascii character.`,
        difficulty: 'EASY',
        timeLimitMs: 1000,
        memoryLimitKb: 262144,
        isPublic: true,
      },
    });
    console.log('✅ Problem created:', reverseString.id);

    await prisma.problem.update({
      where: { id: reverseString.id },
      data: {
        tags: {
          create: [
            { tag: { connect: { id: tags[3].id } } },
            { tag: { connect: { id: tags[2].id } } },
          ],
        },
      },
    });

    await prisma.testCase.deleteMany({ where: { problemId: reverseString.id } });
    
    const reverseTestCases = await generateReverseStringTestCases(50);
    inserted = 0;
    
    for (const tc of reverseTestCases) {
      await prisma.testCase.create({
        data: {
          problemId: reverseString.id,
          ...tc,
        },
      });
      inserted++;
      if (inserted % 10 === 0) {
        console.log(`  ✅ Inserted ${inserted} test cases...`);
      }
    }
    console.log(`✅ Created ${inserted} test cases for Reverse String`);

    console.log('\n📋 Summary:');
    console.log('═══════════════════════════════════════');
    console.log(`User ID: ${user.id}`);
    console.log(`\nProblem 1: ${twoSum.title}`);
    console.log(`  ID: ${twoSum.id}`);
    console.log(`  Slug: ${twoSum.slug}`);
    console.log(`  Test Cases: 50 (3 sample, 47 hidden)`);
    console.log(`\nProblem 2: ${reverseString.title}`);
    console.log(`  ID: ${reverseString.id}`);
    console.log(`  Slug: ${reverseString.slug}`);
    console.log(`  Test Cases: 50 (3 sample, 47 hidden)`);
    
    // Verify counts
    const tc1Count = await prisma.testCase.count({ where: { problemId: twoSum.id } });
    const tc2Count = await prisma.testCase.count({ where: { problemId: reverseString.id } });
    
    console.log(`\n✅ Verification:`);
    console.log(`  Two Sum test cases: ${tc1Count}`);
    console.log(`  Reverse String test cases: ${tc2Count}`);
    
    console.log('\n🎉 Bulk seed completed successfully!');
    
    console.log('\n📝 Test Commands:');
    console.log(`\n# Test Two Sum (Python):`);
    console.log(`curl -X POST http://localhost:3001/api/submit \\
  -H "Content-Type: application/json" \\
  -d '{
    "userId": "${user.id}",
    "problemId": "${twoSum.id}",
    "code": "nums = list(map(int, input().split()))\\ntarget = int(input())\\nseen = {}\\nfor i, num in enumerate(nums):\\n    complement = target - num\\n    if complement in seen:\\n        print(f'\\''{seen[complement]} {i}'\\'')\\n        break\\n    seen[num] = i",
    "language": "PYTHON"
  }'`);
    
    console.log(`\n# Test Reverse String (Python):`);
    console.log(`curl -X POST http://localhost:3001/api/submit \\
  -H "Content-Type: application/json" \\
  -d '{
    "userId": "${user.id}",
    "problemId": "${reverseString.id}",
    "code": "s = input().split()\\nprint(' '.join(s[::-1]))",
    "language": "PYTHON"
  }'`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();