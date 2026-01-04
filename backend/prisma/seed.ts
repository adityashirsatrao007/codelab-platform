import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Civil Engineering',
  'Mechanical Engineering',
  'Electronics & Telecommunication',
  'Electrical Engineering'
];

const DIVISIONS = ['A', 'B'];
const YEARS = [1, 2, 3, 4];

async function main() {
  console.log('Start seeding...');

  try {
    for (const department of DEPARTMENTS) {
      for (const year of YEARS) {
        for (const division of DIVISIONS) {
          const className = `${department} - Division ${division} - Year ${year}`;
          
          await prisma.class.upsert({
            where: {
              department_division_year: {
                department,
                division,
                year
              }
            },
            update: {},
            create: {
              name: className,
              department,
              division,
              year
            }
          });
        }
      }
    }
    console.log('Seeding finished.');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
