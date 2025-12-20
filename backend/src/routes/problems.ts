import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin, optionalAuth, AuthRequest } from '../middleware/auth';
import { LeetCodeSyncService } from '../services/leetcodeSync';

const router = Router();
const prisma = new PrismaClient();

// Get all problems (public, filtered)
router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { difficulty, category, search, page = 1, limit = 50 } = req.query;
    const isAdmin = req.user?.role === 'admin';

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    
    // Only show published problems to non-admins
    if (!isAdmin) {
      where.isPublished = true;
    }

    if (difficulty && typeof difficulty === 'string') {
      where.difficulty = difficulty;
    }
    if (category && typeof category === 'string') {
      where.category = category;
    }
    if (req.query.company && typeof req.query.company === 'string') {
      where.companies = { has: req.query.company };
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        // If search is a number, try to match frontendId
        ...( !isNaN(Number(search)) ? [{ frontendId: Number(search) }] : [])
      ];
    }

    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        select: {
          id: true,
          frontendId: true,
          title: true,
          slug: true,
          difficulty: true,
          category: true,
          companies: true,
          isPublished: true,
          order: true,
          _count: {
            select: {
              submissions: {
                where: { status: 'accepted' },
              },
            },
          },
        },
        orderBy: { frontendId: 'asc' }, // Sort by Serial Number
        skip,
        take: limitNum,
      }),
      prisma.problem.count({ where }),
    ]);

    // Get user's solved problems if logged in
    let solvedProblems: string[] = [];
    if (req.user) {
      const userSubmissions = await prisma.submission.findMany({
        where: {
          userId: req.user.id,
          status: 'accepted',
        },
        select: { problemId: true },
        distinct: ['problemId'],
      });
      solvedProblems = userSubmissions.map((s) => s.problemId);
    }

    const problemsWithStatus = problems.map((p) => ({
      ...p,
      acceptedCount: p._count.submissions,
      solved: solvedProblems.includes(p.id),
    }));

    res.json({
      problems: problemsWithStatus,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      }
    });
  } catch (error) {
    console.error('Get problems error:', error);
    res.status(500).json({ error: 'Failed to get problems' });
  }
});

// Get categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await prisma.problem.findMany({
      where: { isPublished: true },
      select: { category: true },
      distinct: ['category'],
    });
    res.json(categories.map((c) => c.category));
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Get companies
router.get('/meta/companies', async (req, res) => {
  try {
    // Get all problems and flatten companies
    const problems = await prisma.problem.findMany({
      where: { isPublished: true },
      select: { companies: true }
    });
    
    const companySet = new Set<string>();
    problems.forEach(p => {
        p.companies.forEach(c => companySet.add(c));
    });
    
    res.json(Array.from(companySet).sort());
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Failed to get companies' });
  }
});

// Get problem by slug
router.get('/:slug', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { slug } = req.params;
    const isAdmin = req.user?.role === 'admin';

    const problem = await prisma.problem.findUnique({
      where: { slug },
      include: {
        testCases: {
          where: { isHidden: false },
          take: 3, // Show first 3 public test cases
        },
      },
    });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Hide unpublished problems from non-admins
    if (!problem.isPublished && !isAdmin) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Parse specific JSON fields if they are strings
    let starterCodeObj = JSON.parse(problem.starterCode);
    let hintsObj = problem.hints ? JSON.parse(problem.hints) : [];
    
    // Check if starterCode is valid or placeholder
    const isMissingCode = !starterCodeObj.python || starterCodeObj.python.includes("# Code not available");

    if (isMissingCode) {
        // Lazy Sync!
        try {
            console.log(`Lazy syncing code for ${slug}...`);
            const syncService = new LeetCodeSyncService();
            const detail = await syncService.fetchProblemDetail(slug);
            
            if (detail && detail.codeSnippets) {
                const newStarterCode: Record<string, string> = {};
                detail.codeSnippets.forEach((snippet) => {
                     // Standardize keys to match frontend expectation
                    if (snippet.langSlug === 'python3') newStarterCode.python = snippet.code;
                    if (snippet.langSlug === 'javascript') newStarterCode.javascript = snippet.code;
                    if (snippet.langSlug === 'typescript') newStarterCode.typescript = snippet.code;
                    if (snippet.langSlug === 'cpp') newStarterCode.cpp = snippet.code;
                    if (snippet.langSlug === 'java') newStarterCode.java = snippet.code;
                    if (snippet.langSlug === 'c') newStarterCode.c = snippet.code;
                    if (snippet.langSlug === 'csharp') newStarterCode.csharp = snippet.code;
                    if (snippet.langSlug === 'ruby') newStarterCode.ruby = snippet.code;
                    if (snippet.langSlug === 'golang') newStarterCode.go = snippet.code;
                    if (snippet.langSlug === 'rust') newStarterCode.rust = snippet.code;
                    if (snippet.langSlug === 'php') newStarterCode.php = snippet.code;
                });
                
                // Update DB
                await prisma.problem.update({
                    where: { id: problem.id },
                    data: {
                        starterCode: JSON.stringify(newStarterCode),
                        hints: JSON.stringify(detail.hints || [])
                    }
                });
                
                // Update local objects
                starterCodeObj = newStarterCode;
                hintsObj = detail.hints || [];
                console.log(`Lazy sync successful for ${slug}`);
            }
        } catch (err) {
            console.error(`Lazy sync failed for ${slug}:`, err);
            // Fallback to existing code so we don't crash request
        }
    }

    const parsedProblem = {
        ...problem,
        starterCode: starterCodeObj,
        hints: hintsObj,
    };

    res.json(parsedProblem);
  } catch (error) {
    console.error('Get problem error:', error);
    res.status(500).json({ error: 'Failed to get problem' });
  }
});

export default router;
