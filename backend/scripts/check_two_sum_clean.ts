
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const p = await prisma.problem.findUnique({
    where: { slug: 'two-sum' },
    select: { id: true, title: true, frontendId: true, slug: true }
  });
  console.log('Two Sum Check:', JSON.stringify(p, null, 2));
}

check();
