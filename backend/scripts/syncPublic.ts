
import { LeetCodeSyncService } from '../src/services/leetcodeSync';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const syncer = new LeetCodeSyncService();

async function main() {
  try {
    console.log('Fetching top 300 problems from LeetCode...');
    await syncer.syncProblems(300);
    console.log('Done!');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
