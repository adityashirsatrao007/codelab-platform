import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult, query } from 'express-validator';
import {
  authenticateToken,
  requireVerified,
  requireTeacher,
  AuthRequest,
} from '../middleware/auth.js';
import { submissionLimiter } from '../middleware/rateLimiter.js';

const router = Router();
const prisma = new PrismaClient();

// ============== TEACHER ROUTES ==============

// Get teacher's classes
router.get('/my-classes', authenticateToken, requireTeacher, async (req: Request, res: Response) => {
  try {
    const teacherClasses = await prisma.classTeacher.findMany({
      where: { teacherId: req.user!.id },
      include: {
        class: {
          include: {
            _count: {
              select: { students: true },
            },
          },
        },
      },
    });

    res.json(teacherClasses.map((tc) => tc.class));
  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({ error: 'Failed to get classes' });
  }
});

// Create assignment (teacher only)
router.post(
  '/',
  authenticateToken,
  requireTeacher,
  [
    body('title').notEmpty().trim(),
    body('description').optional().trim(),
    body('classId').notEmpty(),
    body('deadline').isISO8601(),
    body('problemIds').isArray({ min: 1 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, classId, deadline, problemIds, maxScore } = req.body;

      // Verify teacher has access to this class
      const teacherClass = await prisma.classTeacher.findUnique({
        where: {
          classId_teacherId: {
            classId,
            teacherId: req.user!.id,
          },
        },
      });

      if (!teacherClass) {
        return res.status(403).json({ error: 'You do not have access to this class' });
      }

      // Create assignment
      const assignment = await prisma.assignment.create({
        data: {
          title,
          description,
          classId,
          teacherId: req.user!.id,
          deadline: new Date(deadline),
          problems: {
            create: problemIds.map((problemId: string, index: number) => ({
              problemId,
              order: index + 1,
            })),
          },
        },
        include: {
          problems: {
            include: {
              problem: true,
            },
            orderBy: { order: 'asc' },
          },
          class: true,
        },
      });

      res.status(201).json({
        message: 'Assignment created successfully',
        assignment,
      });
    } catch (error) {
      console.error('Create assignment error:', error);
      res.status(500).json({ error: 'Failed to create assignment' });
    }
  }
);

// Get teacher's assignments
router.get('/my-assignments', authenticateToken, requireTeacher, async (req: Request, res: Response) => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: { teacherId: req.user!.id },
      include: {
        class: true,
        problems: {
          include: { problem: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(assignments);
  } catch (error) {
    console.error('Get teacher assignments error:', error);
    res.status(500).json({ error: 'Failed to get assignments' });
  }
});

// Get assignment submissions (teacher only)
router.get('/:assignmentId/submissions', authenticateToken, requireTeacher, async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;

    // Verify teacher owns this assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { class: true },
    });

    if (!assignment || assignment.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all students in the class with their submissions
    const students = await prisma.profile.findMany({
      where: { classId: assignment.classId },
      include: {
        user: {
          select: { id: true, email: true, username: true, isVerified: true },
        },
      },
    });

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: {
          select: { id: true, email: true, username: true },
        },
      },
    });

    // Map students to their submissions
    const result = students.map((profile) => {
      const submission = submissions.find((s) => s.studentId === profile.userId);
      return {
        student: {
          id: profile.userId,
          email: profile.user.email,
          username: profile.user.username,
          fullName: profile.fullName,
          rollNumber: profile.rollNumber,
          isVerified: profile.user.isVerified,
        },
        submission: submission || null,
        status: submission
          ? submission.isLate
            ? 'late'
            : 'submitted'
          : new Date() > assignment.deadline
            ? 'missing'
            : 'pending',
      };
    });

    res.json({
      assignment,
      submissions: result,
    });
  } catch (error) {
    console.error('Get assignment submissions error:', error);
    res.status(500).json({ error: 'Failed to get submissions' });
  }
});

// Update assignment (teacher only)
router.put('/:assignmentId', authenticateToken, requireTeacher, async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const { title, description, deadline, isPublished } = req.body;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment || assignment.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        title,
        description,
        deadline: deadline ? new Date(deadline) : undefined,
        isPublished,
      },
      include: {
        class: true,
        problems: {
          include: { problem: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    res.json({ message: 'Assignment updated', assignment: updated });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// Delete assignment (teacher only)
router.delete('/:assignmentId', authenticateToken, requireTeacher, async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment || assignment.teacherId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.assignment.delete({ where: { id: assignmentId } });
    res.json({ message: 'Assignment deleted' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// ============== STUDENT ROUTES ==============

// Get student's assignments
router.get('/student', authenticateToken, requireVerified, async (req: Request, res: Response) => {
  try {
    // Get student's class
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!profile?.classId) {
      return res.status(400).json({ error: 'You are not assigned to a class' });
    }

    const assignments = await prisma.assignment.findMany({
      where: {
        classId: profile.classId,
        isPublished: true,
      },
      include: {
        problems: {
          include: { problem: true },
          orderBy: { order: 'asc' },
        },
        teacher: {
          select: { id: true, username: true, profile: { select: { fullName: true } } },
        },
      },
      orderBy: { deadline: 'asc' },
    });

    // Get student's submissions for these assignments
    const assignmentIds = assignments.map((a) => a.id);
    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        assignmentId: { in: assignmentIds },
        studentId: req.user!.id,
      },
    });

    const result = assignments.map((assignment) => {
      const submission = submissions.find((s) => s.assignmentId === assignment.id);
      const isPastDeadline = new Date() > assignment.deadline;

      return {
        ...assignment,
        submission,
        status: submission
          ? submission.isLate
            ? 'submitted_late'
            : 'submitted'
          : isPastDeadline
            ? 'overdue'
            : 'pending',
        isPastDeadline,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Get student assignments error:', error);
    res.status(500).json({ error: 'Failed to get assignments' });
  }
});

// Get specific assignment (student view)
router.get('/:assignmentId', authenticateToken, requireVerified, async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
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
        teacher: {
          select: { id: true, username: true, profile: { select: { fullName: true } } },
        },
        class: true,
      },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Verify student is in this class
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.id },
    });

    // Allow teachers to view any assignment
    if (req.user!.role !== 'teacher' && profile?.classId !== assignment.classId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get student's submission
    const submission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId: req.user!.id,
      },
    });

    res.json({
      ...assignment,
      submission,
      isPastDeadline: new Date() > assignment.deadline,
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ error: 'Failed to get assignment' });
  }
});

// Submit assignment problem solution
router.post(
  '/:assignmentId/submit',
  authenticateToken,
  requireVerified,
  submissionLimiter,
  async (req: Request, res: Response) => {
    try {
      const { assignmentId } = req.params;
      const { problemId, code, language } = req.body;

      // Verify assignment exists and is active
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
          problems: true,
        },
      });

      if (!assignment || !assignment.isPublished) {
        return res.status(404).json({ error: 'Assignment not found or inactive' });
      }

      // Verify student is in this class
      const profile = await prisma.profile.findUnique({
        where: { userId: req.user!.id },
      });

      if (profile?.classId !== assignment.classId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check if problem is in assignment
      if (!assignment.problems.some((p) => p.problemId === problemId)) {
        return res.status(400).json({ error: 'Problem not in assignment' });
      }

      const isLate = new Date() > assignment.deadline;

      // Create or update submission
      // Check for existing submission for this problem
      const existingSubmission = await prisma.assignmentSubmission.findFirst({
        where: {
          assignmentId,
          studentId: req.user!.id,
          problemId,
        },
      });

      let submission;
      if (existingSubmission) {
        submission = await prisma.assignmentSubmission.update({
          where: { id: existingSubmission.id },
          data: {
            code,
            language,
            isLate,
            submittedAt: new Date(),
          },
        });
      } else {
        submission = await prisma.assignmentSubmission.create({
          data: {
            assignmentId,
            studentId: req.user!.id,
            problemId,
            code,
            language,
            isLate,
          },
        });
      }

      // Create the actual code submission
      const codeSubmission = await prisma.submission.create({
        data: {
          userId: req.user!.id,
          problemId,
          code,
          language,
          status: 'pending',
        },
      });

      res.json({
        message: isLate ? 'Submitted (late)' : 'Submitted successfully',
        submission,
        codeSubmission,
        isLate,
      });
    } catch (error) {
      console.error('Submit assignment error:', error);
      res.status(500).json({ error: 'Failed to submit' });
    }
  }
);

// ============== COMMON ROUTES ==============

// Get all assignments for a class (teacher or admin)
router.get('/class/:classId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;

    // Verify access
    if (req.user!.role === 'teacher') {
      const teacherClass = await prisma.classTeacher.findUnique({
        where: {
          classId_teacherId: {
            classId,
            teacherId: req.user!.id,
          },
        },
      });

      if (!teacherClass) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (!['admin', 'superadmin', 'coordinator'].includes(req.user!.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const assignments = await prisma.assignment.findMany({
      where: { classId },
      include: {
        problems: {
          include: { problem: true },
          orderBy: { order: 'asc' },
        },
        teacher: {
          select: { id: true, username: true, profile: { select: { fullName: true } } },
        },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { deadline: 'desc' },
    });

    res.json(assignments);
  } catch (error) {
    console.error('Get class assignments error:', error);
    res.status(500).json({ error: 'Failed to get assignments' });
  }
});

export default router;
