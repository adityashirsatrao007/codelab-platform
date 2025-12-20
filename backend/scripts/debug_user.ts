
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'adityashirsatrao@orchidengg.ac.in';
  const user = await prisma.user.findUnique({
    where: { email },
    select: { email: true, role: true }
  });

  console.log('User Role:', user?.role);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
