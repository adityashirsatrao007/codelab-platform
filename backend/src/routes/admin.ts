import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { body, validationResult, query } from 'express-validator';
import {
  authenticateToken,
  requireAdmin,
  requireSuperAdmin,
  requireCoordinator,
  AuthRequest,
} from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// ============== SUPERADMIN ROUTES ==============

// Create admin user (superadmin only)
router.post(
  '/users/admin',
  authenticateToken,
  requireSuperAdmin,
  [
    body('email').isEmail().normalizeEmail(),
    body('username').isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
    body('password').isLength({ min: 6 }),
    body('fullName').notEmpty().trim(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, username, password, fullName } = req.body;

      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email or username already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          role: 'admin',
          isVerified: true,
          verificationStatus: 'approved',
          profile: {
            create: { fullName },
          },
        },
        include: { profile: true },
      });

      res.status(201).json({
        message: 'Admin created successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          profile: user.profile,
        },
      });
    } catch (error) {
      console.error('Create admin error:', error);
      res.status(500).json({ error: 'Failed to create admin' });
    }
  }
);

// Get all admins (superadmin only)
router.get('/users/admins', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(admins);
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ error: 'Failed to get admins' });
  }
});

// Delete admin (superadmin only)
router.delete('/users/admin/:id', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== 'admin') {
      return res.status(404).json({ error: 'Admin not found' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

// ============== ADMIN ROUTES ==============

// Create coordinator (admin only)
router.post(
  '/users/coordinator',
  authenticateToken,
  requireAdmin,
  [
    body('email').isEmail().normalizeEmail(),
    body('username').isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
    body('password').isLength({ min: 6 }),
    body('fullName').notEmpty().trim(),
    body('department').notEmpty().trim(),
    body('division').notEmpty().trim(),
    body('year').isInt({ min: 1, max: 6 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, username, password, fullName, department, division, year } = req.body;

      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email or username already exists' });
      }

      // Find or create class
      let classRecord = await prisma.class.findUnique({
        where: {
          department_division_year: {
            department,
            division,
            year: parseInt(year),
          },
        },
      });

      if (!classRecord) {
        classRecord = await prisma.class.create({
          data: {
            name: `${department} - Division ${division} - Year ${year}`,
            department,
            division,
            year: parseInt(year),
          },
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          role: 'coordinator',
          isVerified: true,
          verificationStatus: 'approved',
          profile: {
            create: {
              fullName,
              department,
              division,
              year: parseInt(year),
              classId: classRecord.id,
            },
          },
        },
        include: { profile: true },
      });

      // Update class with coordinator
      await prisma.class.update({
        where: { id: classRecord.id },
        data: { coordinatorId: user.id },
      });

      res.status(201).json({
        message: 'Coordinator created successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          profile: user.profile,
        },
      });
    } catch (error) {
      console.error('Create coordinator error:', error);
      res.status(500).json({ error: 'Failed to create coordinator' });
    }
  }
);

// Create teacher (admin only)
router.post(
  '/users/teacher',
  authenticateToken,
  requireAdmin,
  [
    body('email').isEmail().normalizeEmail(),
    body('username').isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
    body('password').isLength({ min: 6 }),
    body('fullName').notEmpty().trim(),
    body('classIds').isArray().optional(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, username, password, fullName, classIds } = req.body;

      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email or username already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          role: 'teacher',
          isVerified: true,
          verificationStatus: 'approved',
          profile: {
            create: { fullName },
          },
        },
        include: { profile: true },
      });

      // Assign teacher to classes
      if (classIds && classIds.length > 0) {
        await prisma.classTeacher.createMany({
          data: classIds.map((classId: string) => ({
            classId,
            teacherId: user.id,
          })),
        });
      }

      res.status(201).json({
        message: 'Teacher created successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          profile: user.profile,
        },
      });
    } catch (error) {
      console.error('Create teacher error:', error);
      res.status(500).json({ error: 'Failed to create teacher' });
    }
  }
);

// Get all users with filtering (admin+)
router.get(
  '/users',
  authenticateToken,
  requireAdmin,
  [
    query('role').optional().isIn(['student', 'teacher', 'coordinator', 'admin', 'superadmin']),
    query('verificationStatus').optional().isIn(['pending', 'approved', 'rejected']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const { role, verificationStatus, search, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (role) where.role = role;
      if (verificationStatus) where.verificationStatus = verificationStatus;
      if (search) {
        where.OR = [
          { email: { contains: search as string } },
          { username: { contains: search as string } },
          { profile: { fullName: { contains: search as string } } },
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: { profile: { include: { class: true } } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  }
);

// Delete user (admin only, cannot delete superadmin)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'superadmin') {
      return res.status(403).json({ error: 'Cannot delete superadmin' });
    }

    // Admin cannot delete other admins (only superadmin can)
    if (user.role === 'admin' && req.user!.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can delete admins' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============== COORDINATOR ROUTES ==============

// Get pending verifications (Coordinators see their class, Admins see all)
router.get('/verifications/pending', authenticateToken, requireCoordinator, async (req: Request, res: Response) => {
  try {
    const isSuperOrAdmin = ['admin', 'superadmin'].includes(req.user!.role);
    let classId: string | undefined;

    if (!isSuperOrAdmin) {
      const coordinatorProfile = await prisma.profile.findUnique({
        where: { userId: req.user!.id },
      });

      if (!coordinatorProfile?.classId) {
        return res.status(400).json({ error: 'Coordinator not assigned to a class' });
      }
      classId = coordinatorProfile.classId;
    }

    const whereClause: any = {
      role: 'student',
      verificationStatus: 'pending',
    };

    if (classId) {
      whereClause.profile = { classId };
    }

    const pendingUsers = await prisma.user.findMany({
      where: whereClause,
      include: {
        profile: {
          include: { class: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(pendingUsers);
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ error: 'Failed to get pending verifications' });
  }
});

// Verify student (Coordinators for their class, Admins for all)
router.post('/verify/:userId', authenticateToken, requireCoordinator, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { action, rejectionReason } = req.body;
    const isSuperOrAdmin = ['admin', 'superadmin'].includes(req.user!.role);

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Get coordinator's class if not admin
    let coordinatorClassId: string | undefined;
    
    console.log(`[VERIFY] User: ${req.user?.email}, Role: ${req.user?.role}, isSuperOrAdmin: ${isSuperOrAdmin}`);

    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
      const coordinatorProfile = await prisma.profile.findUnique({
        where: { userId: req.user!.id },
      });

      if (!coordinatorProfile?.classId) {
        const debugInfo = `Role: ${req.user?.role}, Email: ${req.user?.email}`;
        console.error(`[VERIFY ERROR] ${debugInfo}`);
        return res.status(400).json({ error: `Coordinator not assigned to a class. (${debugInfo})` });
      }
      coordinatorClassId = coordinatorProfile.classId;
    }

    // Get student
    const student = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if student is in coordinator's class (skip check for admins)
    if (!isSuperOrAdmin && student.profile?.classId !== coordinatorClassId) {
      return res.status(403).json({ error: 'Student not in your class' });
    }

    // Update verification status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: action === 'approve',
        verificationStatus: action === 'approve' ? 'approved' : 'rejected',
        rejectionReason: action === 'reject' ? rejectionReason : null,
        verifiedBy: req.user!.id,
        verifiedAt: new Date(),
      },
      include: { profile: true },
    });

    res.json({
      message: `Student ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        isVerified: updatedUser.isVerified,
        verificationStatus: updatedUser.verificationStatus,
      },
    });
  } catch (error) {
    console.error('Verify student error:', error);
    res.status(500).json({ error: 'Failed to verify student' });
  }
});

// ============== CLASS MANAGEMENT ==============

// Get all classes (admin+)
router.get('/classes', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        coordinator: {
          select: { id: true, email: true, username: true, profile: true },
        },
        teachers: {
          include: {
            teacher: {
              select: { id: true, email: true, username: true, profile: true },
            },
          },
        },
        _count: {
          select: { students: true },
        },
      },
      orderBy: [{ department: 'asc' }, { year: 'asc' }, { division: 'asc' }],
    });

    res.json(classes);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Failed to get classes' });
  }
});

// Create class (admin only)
router.post(
  '/classes',
  authenticateToken,
  requireAdmin,
  [
    body('name').notEmpty().trim(),
    body('department').notEmpty().trim(),
    body('division').notEmpty().trim(),
    body('year').isInt({ min: 1, max: 6 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, department, division, year, coordinatorId } = req.body;

      const existingClass = await prisma.class.findUnique({
        where: {
          department_division_year: {
            department,
            division,
            year: parseInt(year),
          },
        },
      });

      if (existingClass) {
        return res.status(400).json({ error: 'Class already exists' });
      }

      const newClass = await prisma.class.create({
        data: {
          name,
          department,
          division,
          year: parseInt(year),
          coordinatorId,
        },
      });

      res.status(201).json({
        message: 'Class created successfully',
        class: newClass,
      });
    } catch (error) {
      console.error('Create class error:', error);
      res.status(500).json({ error: 'Failed to create class' });
    }
  }
);

// Assign teacher to class (admin only)
router.post('/classes/:classId/teacher', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { teacherId } = req.body;

    const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const existingAssignment = await prisma.classTeacher.findUnique({
      where: {
        classId_teacherId: { classId, teacherId },
      },
    });

    if (existingAssignment) {
      return res.status(400).json({ error: 'Teacher already assigned to this class' });
    }

    await prisma.classTeacher.create({
      data: { classId, teacherId },
    });

    res.json({ message: 'Teacher assigned to class successfully' });
  } catch (error) {
    console.error('Assign teacher error:', error);
    res.status(500).json({ error: 'Failed to assign teacher' });
  }
});

// ============== ANALYTICS ==============

// Get dashboard stats (admin+)
router.get('/stats', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalCoordinators,
      pendingVerifications,
      totalProblems,
      totalSubmissions,
      totalClasses,
      recentSubmissions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'student' } }),
      prisma.user.count({ where: { role: 'teacher' } }),
      prisma.user.count({ where: { role: 'coordinator' } }),
      prisma.user.count({ where: { verificationStatus: 'pending' } }),
      prisma.problem.count(),
      prisma.submission.count(),
      prisma.class.count(),
      prisma.submission.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    res.json({
      totalUsers,
      totalStudents,
      totalTeachers,
      totalCoordinators,
      pendingVerifications,
      totalProblems,
      totalSubmissions,
      totalClasses,
      recentSubmissions,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get submission analytics (admin+)
router.get('/analytics/submissions', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    const submissions = await prisma.submission.groupBy({
      by: ['status'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    });

    const dailySubmissions = await prisma.$queryRaw`
      SELECT DATE(createdAt) as date, COUNT(*) as count
      FROM Submission
      WHERE createdAt >= ${startDate}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;

    res.json({
      byStatus: submissions,
      daily: dailySubmissions,
    });
  } catch (error) {
    console.error('Get submission analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

export default router;
