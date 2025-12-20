
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

// List discussions
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const tag = req.query.tag as string;
    const sort = req.query.sort as string || 'newest';

    const where: any = {};
    if (tag) {
      where.tags = { has: tag };
    }

    const orderBy: any = {};
    if (sort === 'popular') {
      orderBy.votes = { _count: 'desc' };
    } else if (sort === 'views') {
      orderBy.views = 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [discussions, total] = await Promise.all([
      prisma.discussion.findMany({
        where,
        take: limit,
        skip,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              comments: true,
              votes: true,
            },
          },
        },
      }),
      prisma.discussion.count({ where }),
    ]);

    // Calculate score (upvotes - downvotes) manually since Prisma aggregations are tricky on relations
    // Simplified: Just returning raw vote count for now OR we can do a raw query, but let's stick to simple
    // The previous _count.votes is just total votes (up+down). 
    // We will refine this if the user asks for precise scoring.
    
    res.json({
      discussions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List discussions error:', error);
    res.status(500).json({ error: 'Failed to list discussions' });
  }
});

// Create discussion
router.post(
  '/',
  authenticateToken,
  [
    body('title').trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
    body('content').trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
  ],
  async (req: AuthRequest, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, content, tags } = req.body;
      const discussion = await prisma.discussion.create({
        data: {
          title,
          content,
          tags: tags || [],
          userId: req.user!.id,
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
      });

      res.status(201).json(discussion);
    } catch (error) {
      console.error('Create discussion error:', error);
      res.status(500).json({ error: 'Failed to create discussion' });
    }
  }
);

// Get discussion detail
router.get('/:id', async (req, res: any) => {
  try {
    const { id } = req.params;
    
    // Increment view count
    await prisma.discussion.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    const discussion = await prisma.discussion.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            comments: true,
            votes: true,
          },
        },
      },
    });

    if (!discussion) {
      return res.status(404).json({ error: 'Discussion not found' });
    }

    res.json(discussion);
  } catch (error) {
    console.error('Get discussion error:', error);
    res.status(500).json({ error: 'Failed to get discussion' });
  }
});

// Add comment to discussion
router.post(
  '/:id/comments',
  authenticateToken,
  [body('content').trim().notEmpty()],
  async (req: AuthRequest, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { content, parentId } = req.body;

      const comment = await prisma.comment.create({
        data: {
          content,
          userId: req.user!.id,
          discussionId: id,
          parentId,
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
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  }
);

export default router;
