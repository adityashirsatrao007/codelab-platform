import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Get user profile by username (public)
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            fullName: true,
            rollNumber: true,
            department: true,
            division: true,
            year: true,
            college: true,
            bio: true,
            location: true,
            githubUrl: true,
            linkedinUrl: true,
            twitterUrl: true,
            websiteUrl: true,
            skills: true,
            languages: true,
            coins: true,
            solvedCount: true,
            easyCount: true,
            mediumCount: true,
            hardCount: true,
            currentStreak: true,
            maxStreak: true,
            rank: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get total problem counts by difficulty
    const totalByDifficulty = await prisma.problem.groupBy({
      by: ['difficulty'],
      _count: true,
    });

    const totalProblems = await prisma.problem.count();

    // Get activity heatmap (submissions per day for last 365 days)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const submissions = await prisma.submission.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: oneYearAgo },
      },
      select: {
        createdAt: true,
      },
    });

    // Group submissions by date
    const activityMap = new Map<string, number>();
    submissions.forEach((s) => {
      const dateStr = s.createdAt.toISOString().split('T')[0];
      activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
    });

    const activityHeatmap = Array.from(activityMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    // Get language stats
    const languageSubmissions = await prisma.submission.groupBy({
      by: ['language'],
      where: {
        userId: user.id,
        status: 'accepted',
      },
      _count: true,
    });

    const totalLanguageSubmissions = languageSubmissions.reduce((sum, l) => sum + l._count, 0);
    const languageStats = languageSubmissions.map((l) => ({
      language: l.language,
      count: l._count,
      percentage: totalLanguageSubmissions > 0 ? Math.round((l._count / totalLanguageSubmissions) * 100) : 0,
    })).sort((a, b) => b.count - a.count);

    // Get recent submissions
    const recentSubmissions = await prisma.submission.findMany({
      where: { userId: user.id },
      include: {
        problem: {
          select: {
            title: true,
            slug: true,
            difficulty: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Calculate rank (based on solved count)
    const usersWithMoreSolved = await prisma.profile.count({
      where: {
        solvedCount: { gt: user.profile?.solvedCount || 0 },
      },
    });
    const rank = usersWithMoreSolved + 1;

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      profile: user.profile ? {
        ...user.profile,
        avatarUrl: null, // Will be added if needed
      } : null,
      stats: {
        totalSolved: user.profile?.solvedCount || 0,
        totalProblems,
        coins: user.profile?.coins || 0,
        currentStreak: user.profile?.currentStreak || 0,
        maxStreak: user.profile?.maxStreak || 0,
        rank,
      },
      difficultyCounts: {
        easy: user.profile?.easyCount || 0,
        medium: user.profile?.mediumCount || 0,
        hard: user.profile?.hardCount || 0,
      },
      totalByDifficulty: {
        easy: totalByDifficulty.find((d) => d.difficulty === 'easy')?._count || 0,
        medium: totalByDifficulty.find((d) => d.difficulty === 'medium')?._count || 0,
        hard: totalByDifficulty.find((d) => d.difficulty === 'hard')?._count || 0,
      },
      languageStats,
      activityHeatmap,
      recentSubmissions: recentSubmissions.map((s) => ({
        id: s.id,
        problemTitle: s.problem.title,
        problemSlug: s.problem.slug,
        language: s.language,
        status: s.status,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { 
      fullName, 
      college, 
      bio, 
      location,
      githubUrl,
      linkedinUrl,
      twitterUrl,
      websiteUrl,
      skills,
      languages,
    } = req.body;

    // GitHub URL is required
    if (githubUrl !== undefined && !githubUrl) {
      return res.status(400).json({ error: 'GitHub URL is required' });
    }

    // Validate GitHub URL format
    if (githubUrl && !githubUrl.match(/^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/)) {
      return res.status(400).json({ error: 'Invalid GitHub URL format. Use: https://github.com/username' });
    }

    const profile = await prisma.profile.update({
      where: { userId: req.user!.id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(college !== undefined && { college }),
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
        ...(githubUrl !== undefined && { githubUrl }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(twitterUrl !== undefined && { twitterUrl }),
        ...(websiteUrl !== undefined && { websiteUrl }),
        ...(skills !== undefined && { skills }),
        ...(languages !== undefined && { languages }),
      },
    });

    res.json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get leaderboard
router.get('/stats/leaderboard', async (req, res) => {
  try {
    const { limit = '50' } = req.query;

    const users = await prisma.user.findMany({
      where: {
        profile: {
          solvedCount: { gt: 0 },
        },
      },
      select: {
        username: true,
        profile: {
          select: {
            fullName: true,
            college: true,
            solvedCount: true,
          },
        },
      },
      orderBy: {
        profile: {
          solvedCount: 'desc',
        },
      },
      take: parseInt(limit as string),
    });

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      fullName: user.profile?.fullName,
      college: user.profile?.college,
      solvedCount: user.profile?.solvedCount || 0,
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

export default router;
