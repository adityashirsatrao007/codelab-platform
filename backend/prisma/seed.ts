import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@codelab.com' },
    update: {},
    create: {
      email: 'admin@codelab.com',
      username: 'admin',
      passwordHash,
      role: 'superadmin',
      isVerified: true,
      verificationStatus: 'approved',
      profile: {
        create: {
          fullName: 'System Admin',
          college: 'Orchid College of Engineering',
        },
      },
    },
  });

  // Create/Update Real User as Superadmin
  const realAdminEmail = 'adityashirsatrao@orchidengg.ac.in';
  const existingRealAdmin = await prisma.user.findUnique({ where: { email: realAdminEmail } });
  
  if (existingRealAdmin) {
    await prisma.user.update({
      where: { email: realAdminEmail },
      data: { role: 'superadmin', isVerified: true, verificationStatus: 'approved' }
    });
    console.log(`Promoted ${realAdminEmail} to Superadmin`);
  } else {
    await prisma.user.create({
      data: {
        email: realAdminEmail,
        username: 'aditya_admin',
        passwordHash, // Uses same default password
        role: 'superadmin',
        isVerified: true,
        verificationStatus: 'approved',
        profile: {
          create: {
            fullName: 'Aditya Shirsatrao',
            college: 'N. K. Orchid College of Engineering & Technology, Solapur',
          },
        },
      },
    });
    console.log(`Created Superadmin: ${realAdminEmail}`);
  }

  // Create sample user
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'student@codelab.com' },
    update: {},
    create: {
      email: 'student@codelab.com',
      username: 'student',
      passwordHash: userPassword,
      role: 'student',
      profile: {
        create: {
          fullName: 'Test Student',
          college: 'CodeLab College',
        },
      },
    },
  });

  // Create sample problems
  const problems = [
    {
      title: 'Two Sum',
      slug: 'two-sum',
      difficulty: 'easy',
      category: 'arrays',
      description: `# Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

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
\`\`\``,
      constraints: `- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists.`,
      starterCode: JSON.stringify({
        python: `def twoSum(nums: list[int], target: int) -> list[int]:
    # Write your solution here
    pass

# Do not modify below this line
if __name__ == "__main__":
    import json
    import sys
    input_data = json.loads(sys.stdin.read())
    nums = input_data["nums"]
    target = input_data["target"]
    result = twoSum(nums, target)
    print(json.dumps(sorted(result)))`,
        javascript: `function twoSum(nums, target) {
    // Write your solution here
}

// Do not modify below this line
const readline = require('readline');
let input = '';
process.stdin.on('data', (chunk) => input += chunk);
process.stdin.on('end', () => {
    const data = JSON.parse(input);
    const result = twoSum(data.nums, data.target);
    console.log(JSON.stringify(result.sort((a,b) => a-b)));
});`,
        typescript: `function twoSum(nums: number[], target: number): number[] {
    // Write your solution here
    return [];
}

// Do not modify below this line
declare var require: any;
declare var process: any;
const readline = require('readline');
let input = '';
process.stdin.on('data', (chunk: any) => input += chunk);
process.stdin.on('end', () => {
    const data = JSON.parse(input);
    const result = twoSum(data.nums, data.target);
    console.log(JSON.stringify(result.sort((a: number, b: number) => a-b)));
});`,
        java: `import java.io.*;
import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[]{};
    }
}

// Do not modify below this line
public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        // Simple JSON parsing
        // ... (Simplified for seed)
        System.out.println("[0,1]"); // Mock output for basic seed
    }
}`,
        cpp: `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // Write your solution here
    return {};
}

// Do not modify below this line
int main() {
    string line;
    getline(cin, line);
    // Simple JSON parsing for array and target
    // Format: {"nums":[2,7,11,15],"target":9}
    vector<int> nums;
    int target;
    // Parse nums array
    size_t start = line.find('[') + 1;
    size_t end = line.find(']');
    string numsStr = line.substr(start, end - start);
    stringstream ss(numsStr);
    string item;
    while (getline(ss, item, ',')) {
        nums.push_back(stoi(item));
    }
    // Parse target
    size_t targetPos = line.find("\\"target\\":") + 9;
    target = stoi(line.substr(targetPos));
    
    vector<int> result = twoSum(nums, target);
    sort(result.begin(), result.end());
    cout << "[" << result[0] << "," << result[1] << "]" << endl;
    return 0;
}`,
      }),
      solutionCode: JSON.stringify({
        python: `def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
      }),
      testCases: [
        { input: '{"nums":[2,7,11,15],"target":9}', expected: '[0,1]', isHidden: false },
        { input: '{"nums":[3,2,4],"target":6}', expected: '[1,2]', isHidden: false },
        { input: '{"nums":[3,3],"target":6}', expected: '[0,1]', isHidden: false },
        { input: '{"nums":[1,5,8,3,9,2],"target":7}', expected: '[2,5]', isHidden: true },
        { input: '{"nums":[-1,-2,-3,-4,-5],"target":-8}', expected: '[2,4]', isHidden: true },
      ],
    },
    {
      title: 'Palindrome Number',
      slug: 'palindrome-number',
      difficulty: 'easy',
      category: 'math',
      description: `# Palindrome Number

Given an integer \`x\`, return \`true\` if \`x\` is a **palindrome**, and \`false\` otherwise.

An integer is a palindrome when it reads the same backward as forward.

## Example 1:
\`\`\`
Input: x = 121
Output: true
Explanation: 121 reads as 121 from left to right and from right to left.
\`\`\`

## Example 2:
\`\`\`
Input: x = -121
Output: false
Explanation: From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.
\`\`\`

## Example 3:
\`\`\`
Input: x = 10
Output: false
Explanation: Reads 01 from right to left. Therefore it is not a palindrome.
\`\`\``,
      constraints: `- -2^31 <= x <= 2^31 - 1`,
      starterCode: JSON.stringify({
        python: `def isPalindrome(x: int) -> bool:
    # Write your solution here
    pass

# Do not modify below this line
if __name__ == "__main__":
    import json
    import sys
    input_data = json.loads(sys.stdin.read())
    x = input_data["x"]
    result = isPalindrome(x)
    print(json.dumps(result))`,
        javascript: `function isPalindrome(x) {
    // Write your solution here
}

// Do not modify below this line
const readline = require('readline');
let input = '';
process.stdin.on('data', (chunk) => input += chunk);
process.stdin.on('end', () => {
    const data = JSON.parse(input);
    const result = isPalindrome(data.x);
    console.log(JSON.stringify(result));
});`,
      }),
      testCases: [
        { input: '{"x":121}', expected: 'true', isHidden: false },
        { input: '{"x":-121}', expected: 'false', isHidden: false },
        { input: '{"x":10}', expected: 'false', isHidden: false },
        { input: '{"x":12321}', expected: 'true', isHidden: true },
        { input: '{"x":0}', expected: 'true', isHidden: true },
      ],
    },
    {
      title: 'Valid Parentheses',
      slug: 'valid-parentheses',
      difficulty: 'easy',
      category: 'stack',
      description: `# Valid Parentheses

Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

## Example 1:
\`\`\`
Input: s = "()"
Output: true
\`\`\`

## Example 2:
\`\`\`
Input: s = "()[]{}"
Output: true
\`\`\`

## Example 3:
\`\`\`
Input: s = "(]"
Output: false
\`\`\``,
      constraints: `- 1 <= s.length <= 10^4
- s consists of parentheses only '()[]{}'`,
      starterCode: JSON.stringify({
        python: `def isValid(s: str) -> bool:
    # Write your solution here
    pass

# Do not modify below this line
if __name__ == "__main__":
    import json
    import sys
    input_data = json.loads(sys.stdin.read())
    s = input_data["s"]
    result = isValid(s)
    print(json.dumps(result))`,
        javascript: `function isValid(s) {
    // Write your solution here
}

// Do not modify below this line
const readline = require('readline');
let input = '';
process.stdin.on('data', (chunk) => input += chunk);
process.stdin.on('end', () => {
    const data = JSON.parse(input);
    const result = isValid(data.s);
    console.log(JSON.stringify(result));
});`,
      }),
      testCases: [
        { input: '{"s":"()"}', expected: 'true', isHidden: false },
        { input: '{"s":"()[]{}"}', expected: 'true', isHidden: false },
        { input: '{"s":"(]"}', expected: 'false', isHidden: false },
        { input: '{"s":"{[]}"}', expected: 'true', isHidden: true },
        { input: '{"s":"([)]"}', expected: 'false', isHidden: true },
      ],
    },
    {
      title: 'Maximum Subarray',
      slug: 'maximum-subarray',
      difficulty: 'medium',
      category: 'dynamic-programming',
      description: `# Maximum Subarray

Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.

A **subarray** is a contiguous non-empty sequence of elements within an array.

## Example 1:
\`\`\`
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum 6.
\`\`\`

## Example 2:
\`\`\`
Input: nums = [1]
Output: 1
Explanation: The subarray [1] has the largest sum 1.
\`\`\`

## Example 3:
\`\`\`
Input: nums = [5,4,-1,7,8]
Output: 23
Explanation: The subarray [5,4,-1,7,8] has the largest sum 23.
\`\`\``,
      constraints: `- 1 <= nums.length <= 10^5
- -10^4 <= nums[i] <= 10^4`,
      starterCode: JSON.stringify({
        python: `def maxSubArray(nums: list[int]) -> int:
    # Write your solution here
    pass

# Do not modify below this line
if __name__ == "__main__":
    import json
    import sys
    input_data = json.loads(sys.stdin.read())
    nums = input_data["nums"]
    result = maxSubArray(nums)
    print(json.dumps(result))`,
        javascript: `function maxSubArray(nums) {
    // Write your solution here
}

// Do not modify below this line
const readline = require('readline');
let input = '';
process.stdin.on('data', (chunk) => input += chunk);
process.stdin.on('end', () => {
    const data = JSON.parse(input);
    const result = maxSubArray(data.nums);
    console.log(JSON.stringify(result));
});`,
      }),
      testCases: [
        { input: '{"nums":[-2,1,-3,4,-1,2,1,-5,4]}', expected: '6', isHidden: false },
        { input: '{"nums":[1]}', expected: '1', isHidden: false },
        { input: '{"nums":[5,4,-1,7,8]}', expected: '23', isHidden: false },
        { input: '{"nums":[-1,-2,-3,-4]}', expected: '-1', isHidden: true },
        { input: '{"nums":[1,2,3,4,5]}', expected: '15', isHidden: true },
      ],
    },
    {
      title: 'Longest Common Subsequence',
      slug: 'longest-common-subsequence',
      difficulty: 'hard',
      category: 'dynamic-programming',
      description: `# Longest Common Subsequence

Given two strings \`text1\` and \`text2\`, return the length of their **longest common subsequence**. If there is no common subsequence, return \`0\`.

A **subsequence** of a string is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters.

A **common subsequence** of two strings is a subsequence that is common to both strings.

## Example 1:
\`\`\`
Input: text1 = "abcde", text2 = "ace"
Output: 3
Explanation: The longest common subsequence is "ace" and its length is 3.
\`\`\`

## Example 2:
\`\`\`
Input: text1 = "abc", text2 = "abc"
Output: 3
Explanation: The longest common subsequence is "abc" and its length is 3.
\`\`\`

## Example 3:
\`\`\`
Input: text1 = "abc", text2 = "def"
Output: 0
Explanation: There is no such common subsequence, so the result is 0.
\`\`\``,
      constraints: `- 1 <= text1.length, text2.length <= 1000
- text1 and text2 consist of only lowercase English characters.`,
      starterCode: JSON.stringify({
        python: `def longestCommonSubsequence(text1: str, text2: str) -> int:
    # Write your solution here
    pass

# Do not modify below this line
if __name__ == "__main__":
    import json
    import sys
    input_data = json.loads(sys.stdin.read())
    text1 = input_data["text1"]
    text2 = input_data["text2"]
    result = longestCommonSubsequence(text1, text2)
    print(json.dumps(result))`,
        javascript: `function longestCommonSubsequence(text1, text2) {
    // Write your solution here
}

// Do not modify below this line
const readline = require('readline');
let input = '';
process.stdin.on('data', (chunk) => input += chunk);
process.stdin.on('end', () => {
    const data = JSON.parse(input);
    const result = longestCommonSubsequence(data.text1, data.text2);
    console.log(JSON.stringify(result));
});`,
      }),
      testCases: [
        { input: '{"text1":"abcde","text2":"ace"}', expected: '3', isHidden: false },
        { input: '{"text1":"abc","text2":"abc"}', expected: '3', isHidden: false },
        { input: '{"text1":"abc","text2":"def"}', expected: '0', isHidden: false },
        { input: '{"text1":"pmjghexybyrgzczy","text2":"hafcdqbgncrcbihkd"}', expected: '4', isHidden: true },
      ],
    },
  ];

  for (let i = 0; i < problems.length; i++) {
    const problemData = problems[i];
    const problem = await prisma.problem.upsert({
      where: { slug: problemData.slug },
      update: {},
      create: {
        title: problemData.title,
        slug: problemData.slug,
        difficulty: problemData.difficulty,
        category: problemData.category,
        description: problemData.description,
        constraints: problemData.constraints,
        starterCode: problemData.starterCode,
        solutionCode: problemData.solutionCode || null,
        isPublished: true,
        order: i + 1,
      },
    });

    // Create test cases
    for (let j = 0; j < problemData.testCases.length; j++) {
      const tc = problemData.testCases[j];
      await prisma.testCase.upsert({
        where: { id: `${problem.id}-tc-${j}` },
        update: {},
        create: {
          id: `${problem.id}-tc-${j}`,
          problemId: problem.id,
          input: tc.input,
          expected: tc.expected,
          isHidden: tc.isHidden,
          order: j + 1,
        },
      });
    }
  }

  console.log('✅ Database seeded successfully!');
  console.log('📧 Admin: admin@codelab.com / admin123');
  console.log('📧 Student: student@codelab.com / user123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
