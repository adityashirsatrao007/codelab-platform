import { LeetCodeSyncService } from '../src/services/leetcodeSync';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const syncer = new LeetCodeSyncService();

async function main() {
  const limit = 50; // Sync 50 problems
  console.log(`Starting bulk sync of ${limit} problems...`);
  
  try {
    await syncer.syncProblems(limit);
    console.log('Bulk sync completed successfully.');
  } catch (error) {
    console.error('Bulk sync failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
