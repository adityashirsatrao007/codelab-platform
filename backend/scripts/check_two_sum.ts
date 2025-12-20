
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const p = await prisma.problem.findUnique({
    where: { slug: 'two-sum' }
  });
  console.log('Two Sum:', p);
}

check();
