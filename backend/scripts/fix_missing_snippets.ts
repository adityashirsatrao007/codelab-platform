
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { LeetCodeSyncService } from '../src/services/leetcodeSync';

const prisma = new PrismaClient();
const syncService = new LeetCodeSyncService();

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function start() {
    // 1. Find problems with missing code
    // Since starterCode is a string, we can search for the placeholder text.
    // The placeholder I used was: "# Code not available for this problem" (or similar)
    // Let's search for "Code not available"
    
    const problems = await prisma.problem.findMany({
        where: {
            starterCode: {
                contains: 'Code not available'
            },
            isPublished: true, // Only care about published ones for now
        },
        select: {
            id: true,
            slug: true,
            title: true
        }
    });

    console.log(`Found ${problems.length} problems with missing starter code.`);
    
    /* 
       Let's process them in chunks or one by one. 
       We must be careful with rate limits. 
       Let's try to fix the first 50 for now to verify.
    */
    
    const TO_PROCESS = problems.slice(0, 50); // limit to 50 for safety first run
    
    let fixed = 0;
    let failed = 0;

    for (const p of TO_PROCESS) {
        console.log(`Fixing: ${p.title} (${p.slug})...`);
        try {
            const detail = await syncService.fetchProblemDetail(p.slug);
            if (detail && detail.codeSnippets) {
                const starterCode: Record<string, string> = {};
                detail.codeSnippets.forEach((snippet) => {
                    if (snippet.langSlug === 'python3') starterCode.python = snippet.code;
                    if (snippet.langSlug === 'javascript') starterCode.javascript = snippet.code;
                    if (snippet.langSlug === 'typescript') starterCode.typescript = snippet.code;
                    if (snippet.langSlug === 'cpp') starterCode.cpp = snippet.code;
                    if (snippet.langSlug === 'java') starterCode.java = snippet.code;
                    if (snippet.langSlug === 'c') starterCode.c = snippet.code;
                    if (snippet.langSlug === 'csharp') starterCode.csharp = snippet.code;
                    if (snippet.langSlug === 'ruby') starterCode.ruby = snippet.code;
                    if (snippet.langSlug === 'golang') starterCode.go = snippet.code;
                    if (snippet.langSlug === 'rust') starterCode.rust = snippet.code;
                    if (snippet.langSlug === 'php') starterCode.php = snippet.code;
                });

                // Update DB
                await prisma.problem.update({
                    where: { id: p.id },
                    data: {
                        starterCode: JSON.stringify(starterCode)
                    }
                });
                console.log(`  -> Fixed!`);
                fixed++;
            } else {
                console.log(`  -> No snippets found in LeetCode API (Maybe premium?)`);
                failed++;
            }
        } catch (e) {
            console.error(`  -> Error:`, e.message);
            failed++;
        }
        
        // Wait 2 seconds between requests
        await delay(2000); 
    }

    console.log(`Batch complete. Fixed: ${fixed}, Failed/Skipped: ${failed}`);
}

start()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
