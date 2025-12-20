import { Router } from 'express';
import { LeetCodeSyncService } from '../services/leetcodeSync.js';
import { authenticateToken, requireAdmin, requireSuperAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();
const syncService = new LeetCodeSyncService();

// Trigger manual sync (SuperAdmin only)
router.post('/trigger', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { count = 10, type = 'api' } = req.body; // type: 'api' | 'full'
    
    if (type === 'full') {
        // Run full JSON sync in background
        syncService.syncFromExternalJSON().catch(err => console.error('Background JSON sync error:', err));
        return res.json({ message: 'Full sync started in background (this may take a minute)' });
    }

    // Run in background if count is large, or await if small
    if (count > 5) {
      syncService.syncProblems(count).catch(err => console.error('Background sync/error:', err));
      return res.json({ message: `Sync started for top ${count} problems in background` });
    } else {
      await syncService.syncProblems(count);
      return res.json({ message: `Sync completed for top ${count} problems` });
    }
  } catch (error) {
    console.error('Sync trigger error:', error);
    res.status(500).json({ error: 'Failed to trigger sync' });
  }
});

// Webhook for Cron jobs (secured by secret)
router.post('/cron', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow if CRON_SECRET is not set (development) but warn
      if (!process.env.CRON_SECRET && process.env.NODE_ENV === 'development') {
        console.warn('Warning: CRON_SECRET not set, allowing sync in dev');
      } else {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    // Default to syncing top 20
    syncService.syncProblems(20).catch(err => console.error('Cron sync error:', err));
    
    res.json({ message: 'Scheduled sync started' });
  } catch (error) {
    console.error('Cron sync error:', error);
    res.status(500).json({ error: 'Failed to trigger cron sync' });
  }
});

export default router;
