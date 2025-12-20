
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const problems = await prisma.problem.findMany({
    take: 5,
    select: {
      slug: true,
      starterCode: true,
    }
  });

  console.log("Checking first 5 problems:");
  for (const p of problems) {
    console.log(`Problem: ${p.slug}`);
    console.log(`Starter Code (Raw):`, p.starterCode);
    try {
      const parsed = JSON.parse(p.starterCode);
      console.log(`Starter Code (Parsed keys):`, Object.keys(parsed));
      console.log(`Starter Code (Python type):`, typeof parsed.python);
    } catch (e) {
      console.log(`Failed to parse starterCode:`, e.message);
    }
    console.log("-------------------");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
