import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import {
  authenticateToken,
  requireVerified,
  requireAdmin,
  AuthRequest,
} from '../middleware/auth.js';
import { submissionLimiter } from '../middleware/rateLimiter.js';

const router = Router();
const prisma = new PrismaClient();

// Coin rewards configuration
const COIN_REWARDS = {
  easy: parseInt(process.env.COIN_REWARD_EASY || '5'),
  medium: parseInt(process.env.COIN_REWARD_MEDIUM || '10'),
  hard: parseInt(process.env.COIN_REWARD_HARD || '15'),
  contestTop3: parseInt(process.env.COIN_REWARD_CONTEST || '50'),
};

// ============== PUBLIC ROUTES ==============

// Get upcoming and active contests
router.get('/', async (req: Request, res: Response) => {
  try {
    const now = new Date();

    const contests = await prisma.contest.findMany({
      where: {
        OR: [
          { startTime: { gt: now } }, // Upcoming
          { endTime: { gt: now }, startTime: { lte: now } }, // Active
        ],
      },
      include: {
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    const contestsWithStatus = contests.map((contest) => ({
      ...contest,
      status: now < contest.startTime ? 'upcoming' : 'active',
      participantCount: contest._count.participants,
    }));

    res.json(contestsWithStatus);
  } catch (error) {
    console.error('Get contests error:', error);
    res.status(500).json({ error: 'Failed to get contests' });
  }
});

// Get past contests
router.get('/past', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [contests, total] = await Promise.all([
      prisma.contest.findMany({
        where: {
          endTime: { lt: new Date() },
        },
        include: {
          _count: {
            select: { participants: true },
          },
        },
        orderBy: { endTime: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.contest.count({
        where: { endTime: { lt: new Date() } },
      }),
    ]);

    res.json({
      contests: contests.map((c) => ({
        ...c,
        status: 'ended',
        participantCount: c._count.participants,
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get past contests error:', error);
    res.status(500).json({ error: 'Failed to get past contests' });
  }
});

// Get contest details
router.get('/:contestId', async (req: Request, res: Response) => {
  try {
    const { contestId } = req.params;

    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        problems: {
          include: {
            problem: {
              include: {
                testCases: {
                  where: { isHidden: false },
                  take: 2,
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { participants: true },
        },
      },
    });

    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    const now = new Date();
    const status = now < contest.startTime ? 'upcoming' : now > contest.endTime ? 'ended' : 'active';

    // Hide problems if contest hasn't started
    if (status === 'upcoming') {
      return res.json({
        ...contest,
        problems: [],
        status,
        participantCount: contest._count.participants,
      });
    }

    res.json({
      ...contest,
      status,
      participantCount: contest._count.participants,
    });
  } catch (error) {
    console.error('Get contest error:', error);
    res.status(500).json({ error: 'Failed to get contest' });
  }
});

// Get contest leaderboard
router.get('/:contestId/leaderboard', async (req: Request, res: Response) => {
  try {
    const { contestId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
    });

    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    const [participants, total] = await Promise.all([
      prisma.contestParticipant.findMany({
        where: { contestId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              profile: {
                select: { fullName: true },
              },
            },
          },
        },
        orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
        skip,
        take: Number(limit),
      }),
      prisma.contestParticipant.count({ where: { contestId } }),
    ]);

    const leaderboard = participants.map((p: any, index: number) => ({
      rank: skip + index + 1,
      user: p.user,
      score: p.score,
      solvedCount: p.solvedCount,
    }));

    res.json({
      leaderboard,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// ============== AUTHENTICATED ROUTES ==============

// Register for contest
router.post('/:contestId/register', authenticateToken, requireVerified, async (req: AuthRequest, res: Response) => {
  try {
    const { contestId } = req.params;

    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
    });

    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    const now = new Date();
    if (now > contest.endTime) {
      return res.status(400).json({ error: 'Contest has ended' });
    }

    // Check if already registered
    const existing = await prisma.contestParticipant.findUnique({
      where: {
        contestId_userId: {
          contestId,
          userId: req.user!.id,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Already registered' });
    }

    const participant = await prisma.contestParticipant.create({
      data: {
        contestId,
        userId: req.user!.id,
      },
    });

    res.json({
      message: 'Registered successfully',
      participant,
    });
  } catch (error) {
    console.error('Register for contest error:', error);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// Submit solution for contest problem
router.post(
  '/:contestId/submit',
  authenticateToken,
  requireVerified,
  submissionLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      const { contestId } = req.params;
      const { problemId, code, language } = req.body;

      const contest = await prisma.contest.findUnique({
        where: { id: contestId },
        include: { problems: true },
      });

      if (!contest) {
        return res.status(404).json({ error: 'Contest not found' });
      }

      const now = new Date();
      if (now < contest.startTime) {
        return res.status(400).json({ error: 'Contest has not started' });
      }
      if (now > contest.endTime) {
        return res.status(400).json({ error: 'Contest has ended' });
      }

      // Verify problem is in contest
      if (!contest.problems.some((p) => p.id === problemId)) {
        return res.status(400).json({ error: 'Problem not in contest' });
      }

      // Verify user is registered
      const participant = await prisma.contestParticipant.findUnique({
        where: {
          contestId_userId: {
            contestId,
            userId: req.user!.id,
          },
        },
      });

      if (!participant) {
        return res.status(400).json({ error: 'Not registered for contest' });
      }

      // Create submission
      const submission = await prisma.submission.create({
        data: {
          userId: req.user!.id,
          problemId,
          code,
          language,
          status: 'pending',
        },
      });

      res.json({
        message: 'Submitted successfully',
        submission,
      });
    } catch (error) {
      console.error('Contest submit error:', error);
      res.status(500).json({ error: 'Failed to submit' });
    }
  }
);

// Get user's contest history
router.get('/user/history', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const participations = await prisma.contestParticipant.findMany({
      where: { userId: req.user!.id },
      include: {
        contest: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(participations);
  } catch (error) {
    console.error('Get contest history error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// ============== ADMIN ROUTES ==============

// Create contest (admin only)
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  [
    body('title').notEmpty().trim(),
    body('description').optional().trim(),
    body('startTime').isISO8601(),
    body('endTime').isISO8601(),
    body('problemIds').isArray({ min: 1 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, startTime, endTime, problemIds, isWeekly } = req.body;

      // Validate times
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (start >= end) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }

      const contest = await prisma.contest.create({
        data: {
          title,
          description,
          startTime: start,
          endTime: end,
          isWeekly: isWeekly || false,
          problems: {
            connect: problemIds.map((id: string) => ({ id })),
          },
        },
        include: {
          problems: true,
        },
      });

      res.status(201).json({
        message: 'Contest created successfully',
        contest,
      });
    } catch (error) {
      console.error('Create contest error:', error);
      res.status(500).json({ error: 'Failed to create contest' });
    }
  }
);

// Update contest (admin only)
router.put('/:contestId', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { contestId } = req.params;
    const { title, description, startTime, endTime, problemIds } = req.body;

    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
    });

    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);
    if (problemIds) {
      updateData.problems = {
        set: problemIds.map((id: string) => ({ id })),
      };
    }

    const updated = await prisma.contest.update({
      where: { id: contestId },
      data: updateData,
      include: { problems: true },
    });

    res.json({ message: 'Contest updated', contest: updated });
  } catch (error) {
    console.error('Update contest error:', error);
    res.status(500).json({ error: 'Failed to update contest' });
  }
});

// Delete contest (admin only)
router.delete('/:contestId', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { contestId } = req.params;

    await prisma.contest.delete({ where: { id: contestId } });
    res.json({ message: 'Contest deleted' });
  } catch (error) {
    console.error('Delete contest error:', error);
    res.status(500).json({ error: 'Failed to delete contest' });
  }
});

// Award coins to top participants (admin only, run after contest ends)
router.post('/:contestId/award-coins', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { contestId } = req.params;

    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
    });

    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    if (new Date() < contest.endTime) {
      return res.status(400).json({ error: 'Contest has not ended yet' });
    }

    // Get top 3 participants
    const topParticipants = await prisma.contestParticipant.findMany({
      where: { contestId },
      orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
      take: 3,
    });

    const awards = [];
    for (let i = 0; i < topParticipants.length; i++) {
      const participant = topParticipants[i];
      const coinAmount = COIN_REWARDS.contestTop3 * (3 - i); // 150, 100, 50 for 1st, 2nd, 3rd

      // Award coins
      await prisma.profile.update({
        where: { userId: participant.userId },
        data: {
          coins: { increment: coinAmount },
        },
      });

      // Record transaction
      await prisma.coinTransaction.create({
        data: {
          userId: participant.userId,
          amount: coinAmount,
          type: 'contest_reward',
          description: `Rank ${i + 1} in contest: ${contest.title}`,
        },
      });

      awards.push({
        rank: i + 1,
        userId: participant.userId,
        coins: coinAmount,
      });
    }

    res.json({
      message: 'Coins awarded to top participants',
      awards,
    });
  } catch (error) {
    console.error('Award coins error:', error);
    res.status(500).json({ error: 'Failed to award coins' });
  }
});

// Get all contests (admin view with more details)
router.get('/admin/all', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const contests = await prisma.contest.findMany({
      include: {
        problems: true,
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    const now = new Date();
    const contestsWithStatus = contests.map((contest) => ({
      ...contest,
      status: now < contest.startTime ? 'upcoming' : now > contest.endTime ? 'ended' : 'active',
      participantCount: contest._count.participants,
    }));

    res.json(contestsWithStatus);
  } catch (error) {
    console.error('Get all contests error:', error);
    res.status(500).json({ error: 'Failed to get contests' });
  }
});

export default router;
