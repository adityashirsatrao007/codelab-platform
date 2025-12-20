
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';
// We need a valid token. Since we can't easily login via script without simulating OAuth, 
// we'll rely on the existing 'admin' user created in seed.ts having a known behavior or 
// strictly speaking, we might need to bypass auth for this test OR use a test token if one was logged.
// Actually, I can use the `prisma` client directly to create a discussion to verify the MODEL works,
// and then use axios to fetch it to verify the ROUTE works (public list doesn't need auth).
// Creating via API needs auth.

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Testing Discussion Board...');

  try {
    // 1. Create a discussion via Prisma (simulating a user post)
    const user = await prisma.user.findUnique({ where: { email: 'admin@codelab.com' } });
    if (!user) throw new Error('Admin user not found');

    const discussion = await prisma.discussion.create({
      data: {
        title: 'Test Discussion from Script',
        content: 'This is a test content markdown.',
        userId: user.id,
        tags: ['Test', 'Script'],
      },
    });
    console.log('✅ Created Discussion via Prisma:', discussion.id);

    // 2. Fetch via API (Public Route)
    const res = await axios.get(`${API_URL}/discussions`);
    console.log('API List Status:', res.status);
    
    const found = res.data.discussions.find((d: any) => d.id === discussion.id);
    if (found) {
      console.log('✅ Discussion found in API response:', found.title);
    } else {
      console.error('❌ Discussion NOT found in API response');
    }

    // 3. Add a comment via Prisma
    const comment = await prisma.comment.create({
        data: {
            content: 'Test comment',
            userId: user.id,
            discussionId: discussion.id
        }
    });
    console.log('✅ Comment added via Prisma');

    // 4. Fetch Detail via API
    const detailRes = await axios.get(`${API_URL}/discussions/${discussion.id}`);
    
    // Check if _count includes comments
    if (detailRes.data._count.comments === 1) {
        console.log('✅ Comment count verified in API detail');
    } else {
        console.error('❌ Comment count mismatch:', detailRes.data._count);
    }

  } catch (e: any) {
    console.error('Test Failed:', e.message);
    if (e.response) console.error('API Response:', e.response.data);
  } finally {
    await prisma.$disconnect();
  }
}

main();
