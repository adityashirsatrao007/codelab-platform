import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireVerified, AuthRequest } from '../middleware/auth.js';
import { executeCode } from '../services/codeRunner.js';
import { submissionLimiter, runCodeLimiter } from '../middleware/rateLimiter.js';

const router = Router();
const prisma = new PrismaClient();

// Coin rewards configuration
const COIN_REWARDS = {
  easy: parseInt(process.env.COIN_REWARD_EASY || '5'),
  medium: parseInt(process.env.COIN_REWARD_MEDIUM || '10'),
  hard: parseInt(process.env.COIN_REWARD_HARD || '15'),
  streak7: parseInt(process.env.COIN_REWARD_STREAK_7 || '20'),
  streak30: parseInt(process.env.COIN_REWARD_STREAK_30 || '100'),
};

// Helper function to update streak
async function updateStreak(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if user already has a streak entry for today
  const existingStreak = await prisma.streak.findFirst({
    where: {
      userId,
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    },
  });

  if (existingStreak) {
    // Already recorded for today
    return existingStreak;
  }

  // Get yesterday's streak
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStreak = await prisma.streak.findFirst({
    where: {
      userId,
      date: {
        gte: yesterday,
        lt: today,
      },
    },
  });

  const profile = await prisma.profile.findUnique({ where: { userId } });
  
  // Calculate new streak
  const newCurrentStreak = yesterdayStreak ? (profile?.currentStreak || 0) + 1 : 1;
  const newMaxStreak = Math.max(newCurrentStreak, profile?.maxStreak || 0);

  // Create streak entry (log for today)
  const streak = await prisma.streak.create({
    data: {
      userId,
      date: today,
      problemsSolved: 1,
    },
  });

  // Update profile
  await prisma.profile.update({
    where: { userId },
    data: { 
      currentStreak: newCurrentStreak,
      maxStreak: newMaxStreak 
    },
  });

  // Award streak bonus coins
  let bonusCoins = 0;
  let bonusReason = '';

  if (newCurrentStreak === 7) {
    bonusCoins = COIN_REWARDS.streak7;
    bonusReason = '7-day streak bonus';
  } else if (newCurrentStreak === 30) {
    bonusCoins = COIN_REWARDS.streak30;
    bonusReason = '30-day streak bonus';
  } else if (newCurrentStreak > 0 && newCurrentStreak % 30 === 0) {
    bonusCoins = COIN_REWARDS.streak30;
    bonusReason = `${newCurrentStreak}-day streak bonus`;
  }

  if (bonusCoins > 0) {
    await prisma.profile.update({
      where: { userId },
      data: { coins: { increment: bonusCoins } },
    });

    await prisma.coinTransaction.create({
      data: {
        userId,
        amount: bonusCoins,
        type: 'streak_bonus',
        description: bonusReason,
      },
    });
  }

  return streak;
}

// Submit code
router.post('/', authenticateToken, requireVerified, submissionLimiter, async (req: Request, res: Response) => {
  try {
    const { problemId, code, language } = req.body;

    if (!problemId || !code || !language) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get problem with test cases
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: {
        testCases: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Create submission record
    const submission = await prisma.submission.create({
      data: {
        userId: req.user!.id,
        problemId,
        code,
        language,
        status: 'running',
        testsTotal: problem.testCases.length,
      },
    });

    // Run code against test cases
    let testsPassed = 0;
    let errorMessage: string | null = null;
    let totalRuntime = 0;
    let status: any = 'accepted';
    const results: any[] = [];

    for (const testCase of problem.testCases) {
      try {
        const result = await executeCode(code, language, testCase.input);
        
        const actualOutput = result.output.trim();
        const expectedOutput = testCase.expected.trim();
        const passed = actualOutput === expectedOutput;

        if (passed) {
          testsPassed++;
        } else if (status === 'accepted') {
          status = 'wrong_answer';
        }

        totalRuntime += result.runtime;

        results.push({
          testCaseId: testCase.id,
          input: testCase.isHidden ? '[Hidden]' : testCase.input,
          expected: testCase.isHidden ? '[Hidden]' : expectedOutput,
          actual: testCase.isHidden ? '[Hidden]' : actualOutput,
          passed,
          runtime: result.runtime,
          isHidden: testCase.isHidden,
        });

        if (result.error) {
          status = result.error.includes('timeout') ? 'time_limit' : 'runtime_error';
          errorMessage = result.error;
          break;
        }
      } catch (error: any) {
        status = 'runtime_error';
        errorMessage = error.message;
        results.push({
          testCaseId: testCase.id,
          passed: false,
          error: error.message,
          isHidden: testCase.isHidden,
        });
        break;
      }
    }

    // Update submission
    const updatedSubmission = await prisma.submission.update({
      where: { id: submission.id },
      data: {
        status,
        testsPassed,
        runtime: totalRuntime,
        errorMessage,
      },
    });

    // Update user's solved count if accepted
    if (status === 'accepted') {
      // Check if this is the first accepted submission for this problem
      const previousAccepted = await prisma.submission.findFirst({
        where: {
          userId: req.user!.id,
          problemId,
          status: 'accepted',
          id: { not: submission.id },
        },
      });

      if (!previousAccepted) {
        // First time solving this problem
        await prisma.profile.update({
          where: { userId: req.user!.id },
          data: {
            solvedCount: { increment: 1 },
          },
        });

        // Award coins based on difficulty
        const difficulty = problem.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard';
        const coinReward = COIN_REWARDS[difficulty] || COIN_REWARDS.easy;

        await prisma.profile.update({
          where: { userId: req.user!.id },
          data: {
            coins: { increment: coinReward },
          },
        });

        // Record coin transaction
        await prisma.coinTransaction.create({
          data: {
            userId: req.user!.id,
            amount: coinReward,
            type: 'problem_solved',
            description: `Solved ${problem.title} (${difficulty})`,
            referenceId: problemId,
          },
        });

        // Update streak
        await updateStreak(req.user!.id);
      }
    }

    res.json({
      submission: updatedSubmission,
      results: results.filter((r) => !r.isHidden || !r.passed), // Only show hidden test results if failed
    });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ error: 'Failed to submit code' });
  }
});

// Run code (without submitting)
router.post('/run', authenticateToken, runCodeLimiter, async (req: Request, res: Response) => {
  try {
    const { code, language, input } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await executeCode(code, language, input || '');

    res.json(result);
  } catch (error) {
    console.error('Run error:', error);
    res.status(500).json({ error: 'Failed to run code' });
  }
});

// Get user's submissions
router.get('/my', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { problemId, limit = '20', offset = '0' } = req.query;

    const where: any = { userId: req.user!.id };
    if (problemId && typeof problemId === 'string') {
      where.problemId = problemId;
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            slug: true,
            difficulty: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json(submissions);
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to get submissions' });
  }
});

// Get submission by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Only allow user to see their own submissions (or admin)
    if (submission.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ error: 'Failed to get submission' });
  }
});

export default router;
