import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { OAuth2Client } from 'google-auth-library';
import { JWT_SECRET, authenticateToken, AuthRequest } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Configure multer for college ID upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/college-ids';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images (jpg, png) and PDF files are allowed'));
    }
  },
});

// Helper function to generate token
function generateToken(user: any) {
  const options: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any };
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isVerified: user.isVerified,
      verificationStatus: user.verificationStatus,
    },
    JWT_SECRET as string,
    options
  );
}

// Google OAuth - Get auth URL or handle token
router.post('/google', authLimiter, async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential required' });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    const { email, sub: googleId, name, picture } = payload;

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email }],
      },
      include: { profile: true },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          avatarUrl: picture,
          role: 'student',
          isVerified: false,
          verificationStatus: 'pending',
          profile: {
            create: {
              fullName: name || '',
            },
          },
        },
        include: { profile: true },
      });
    } else if (!user.googleId) {
      // Link Google account to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, avatarUrl: picture || user.avatarUrl },
        include: { profile: true },
      });
    }

    const token = generateToken(user);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
        avatarUrl: user.avatarUrl,
        profile: user.profile,
      },
      token,
      needsProfileCompletion: user.role === 'student' && !user.profile?.rollNumber,
      needsVerification: user.role === 'student' && !user.isVerified,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// Complete profile for verification (student fills their details)
router.post(
  '/complete-profile',
  authenticateToken,
  upload.single('collegeId'),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { fullName, rollNumber, department, division, year, contactPhone, college, username, githubUrl } = req.body;

      // Validate required fields
      if (!fullName || !rollNumber || !department || !division || !year || !contactPhone || !college || !githubUrl) {
        return res.status(400).json({ error: 'All fields including GitHub URL are required' });
      }

      // Validate GitHub URL format
      if (!githubUrl.match(/^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/)) {
        return res.status(400).json({ error: 'Invalid GitHub URL format. Use: https://github.com/username' });
      }

      // Check if username is taken (if provided)
      if (username) {
        const existingUsername = await prisma.user.findFirst({
          where: {
            username,
            NOT: { id: userId },
          },
        });
        if (existingUsername) {
          return res.status(400).json({ error: 'Username already taken' });
        }
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

      // Update profile
      const collegeIdUrl = req.file ? `/uploads/college-ids/${req.file.filename}` : null;

      await prisma.profile.upsert({
        where: { userId },
        update: {
          fullName,
          rollNumber,
          department,
          division,
          year: parseInt(year),
          contactPhone,
          college,
          collegeIdUrl,
          githubUrl,
          classId: classRecord.id,
        },
        create: {
          userId,
          fullName,
          rollNumber,
          department,
          division,
          year: parseInt(year),
          contactPhone,
          college,
          collegeIdUrl,
          githubUrl,
          classId: classRecord.id,
        },
      });

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          username: username || undefined,
          verificationStatus: 'pending',
        },
        include: { profile: true },
      });

      const token = generateToken(updatedUser);

      res.json({
        message: 'Profile submitted for verification',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          role: updatedUser.role,
          isVerified: updatedUser.isVerified,
          verificationStatus: updatedUser.verificationStatus,
          profile: updatedUser.profile,
        },
        token,
      });
    } catch (error) {
      console.error('Complete profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// Legacy email/password register (kept for admin/teacher creation)
router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('username').isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
    body('password').isLength({ min: 6 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, username, password, fullName, college } = req.body;

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        return res.status(400).json({
          error: existingUser.email === email ? 'Email already registered' : 'Username already taken',
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          role: 'student',
          isVerified: false,
          verificationStatus: 'pending',
          profile: {
            create: {
              fullName: fullName || '',
              college: college || null,
            },
          },
        },
        include: { profile: true },
      });

      const token = generateToken(user);

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          isVerified: user.isVerified,
          verificationStatus: user.verificationStatus,
          profile: user.profile,
        },
        token,
        needsVerification: true,
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }
);

// Login
router.post(
  '/login',
  authLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true },
      });

      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = generateToken(user);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          isVerified: user.isVerified,
          verificationStatus: user.verificationStatus,
          avatarUrl: user.avatarUrl,
          profile: user.profile,
        },
        token,
        needsVerification: user.role === 'student' && !user.isVerified,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  }
);

// Get current user
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        profile: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isVerified: user.isVerified,
      verificationStatus: user.verificationStatus,
      avatarUrl: user.avatarUrl,
      profile: user.profile,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Check verification status
router.get('/verification-status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        isVerified: true,
        verificationStatus: true,
        rejectionReason: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Verification status error:', error);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
});

export default router;
