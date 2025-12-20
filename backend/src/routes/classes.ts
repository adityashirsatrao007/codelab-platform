import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  authenticateToken,
  requireVerified,
  requireCoordinator,
  AuthRequest,
} from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Get all classes (public - for registration form)
router.get('/list', async (req: Request, res: Response) => {
  try {
    const classes = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
        department: true,
        division: true,
        year: true,
      },
      orderBy: [{ department: 'asc' }, { year: 'asc' }, { division: 'asc' }],
    });

    res.json(classes);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Failed to get classes' });
  }
});

// Get unique departments
router.get('/departments', async (req: Request, res: Response) => {
  try {
    const departments = await prisma.class.findMany({
      select: { department: true },
      distinct: ['department'],
      orderBy: { department: 'asc' },
    });

    res.json(departments.map((d) => d.department));
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Failed to get departments' });
  }
});

// Get divisions for a department and year
router.get('/divisions', async (req: Request, res: Response) => {
  try {
    const { department, year } = req.query;

    if (!department || !year) {
      return res.status(400).json({ error: 'Department and year required' });
    }

    const divisions = await prisma.class.findMany({
      where: {
        department: department as string,
        year: parseInt(year as string),
      },
      select: { division: true },
      distinct: ['division'],
      orderBy: { division: 'asc' },
    });

    res.json(divisions.map((d) => d.division));
  } catch (error) {
    console.error('Get divisions error:', error);
    res.status(500).json({ error: 'Failed to get divisions' });
  }
});

// Get class details (authenticated)
router.get('/:classId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        coordinator: {
          select: {
            id: true,
            email: true,
            username: true,
            profile: { select: { fullName: true } },
          },
        },
        teachers: {
          include: {
            teacher: {
              select: {
                id: true,
                email: true,
                username: true,
                profile: { select: { fullName: true } },
              },
            },
          },
        },
        _count: {
          select: { students: true },
        },
      },
    });

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json(classData);
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ error: 'Failed to get class' });
  }
});

// Get my class details (student)
router.get('/my/details', authenticateToken, requireVerified, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.id },
      include: {
        class: {
          include: {
            coordinator: {
              select: {
                id: true,
                email: true,
                username: true,
                profile: { select: { fullName: true } },
              },
            },
            teachers: {
              include: {
                teacher: {
                  select: {
                    id: true,
                    email: true,
                    username: true,
                    profile: { select: { fullName: true } },
                  },
                },
              },
            },
            _count: {
              select: { students: true },
            },
          },
        },
      },
    });

    if (!profile?.class) {
      return res.status(404).json({ error: 'Not assigned to a class' });
    }

    res.json(profile.class);
  } catch (error) {
    console.error('Get my class error:', error);
    res.status(500).json({ error: 'Failed to get class' });
  }
});

// Get classmates (student)
router.get('/my/classmates', authenticateToken, requireVerified, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!profile?.classId) {
      return res.status(404).json({ error: 'Not assigned to a class' });
    }

    const classmates = await prisma.profile.findMany({
      where: {
        classId: profile.classId,
        userId: { not: req.user!.id },
        user: { isVerified: true },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { rollNumber: 'asc' },
    });

    res.json(
      classmates.map((c) => ({
        id: c.userId,
        username: c.user.username,
        fullName: c.fullName,
        rollNumber: c.rollNumber,
        avatarUrl: c.user.avatarUrl,
      }))
    );
  } catch (error) {
    console.error('Get classmates error:', error);
    res.status(500).json({ error: 'Failed to get classmates' });
  }
});

// Get students in coordinator's class
router.get('/coordinator/students', authenticateToken, requireCoordinator, async (req: AuthRequest, res: Response) => {
  try {
    const coordinatorProfile = await prisma.profile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!coordinatorProfile?.classId) {
      return res.status(400).json({ error: 'Not assigned to a class' });
    }

    const students = await prisma.profile.findMany({
      where: {
        classId: coordinatorProfile.classId,
        user: { role: 'student' },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            isVerified: true,
            verificationStatus: true,
            createdAt: true,
          },
        },
      },
      orderBy: { rollNumber: 'asc' },
    });

    res.json(students);
  } catch (error) {
    console.error('Get coordinator students error:', error);
    res.status(500).json({ error: 'Failed to get students' });
  }
});

// Get class leaderboard
router.get('/:classId/leaderboard', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;

    const students = await prisma.profile.findMany({
      where: {
        classId,
        user: { role: 'student', isVerified: true },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            submissions: {
              where: { status: 'accepted' },
              select: { problemId: true },
            },
          },
        },
      },
    });

    // Calculate unique problems solved
    const leaderboard = students
      .map((student) => {
        const uniqueProblems = new Set(student.user.submissions.map((s) => s.problemId));
        return {
          id: student.userId,
          username: student.user.username,
          fullName: student.fullName,
          rollNumber: student.rollNumber,
          avatarUrl: student.user.avatarUrl,
          problemsSolved: uniqueProblems.size,
          coins: student.coins,
          currentStreak: student.currentStreak,
        };
      })
      .sort((a, b) => b.problemsSolved - a.problemsSolved || b.coins - a.coins);

    // Add ranks
    const rankedLeaderboard = leaderboard.map((student, index) => ({
      rank: index + 1,
      ...student,
    }));

    res.json(rankedLeaderboard);
  } catch (error) {
    console.error('Get class leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

export default router;
