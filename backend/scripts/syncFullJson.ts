
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JSON_URL = 'https://raw.githubusercontent.com/noworneverev/leetcode-api/master/data/leetcode_questions.json';

interface LeetCodeJSONItem {
  data: {
    question: {
      questionId: string;
      questionFrontendId: string;
      title: string;
      titleSlug?: string;
      content: string;
      difficulty: string;
      isPaidOnly: boolean;
      topicTags: { name: string; slug: string }[];
      codeSnippets: { lang: string; langSlug: string; code: string }[];
      stats?: string; // JSON string
      url?: string;
    }
  }
}

async function sync() {
  console.log('Downloading full problem dataset (approx 20MB)...');
  
  try {
    const { data } = await axios.get<LeetCodeJSONItem[]>(JSON_URL, {
      maxContentLength: 50 * 1024 * 1024, // 50MB limit
      maxBodyLength: 50 * 1024 * 1024
    });

    console.log(`Downloaded ${data.length} problems. Starting sync...`);
    
    let count = 0;
    let created = 0;
    let updated = 0;

    for (const item of data) {
      const q = item.data?.question;
      if (!q) continue;

      // Determine Slug
      let slug = q.titleSlug;
      if (!slug && q.url) {
        const parts = q.url.split('/problems/');
        if (parts.length > 1) {
          slug = parts[1].replace(/\/$/, '');
        }
      }
      if (!slug) {
         slug = q.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }

      // Map Difficulty
      const diffMap: Record<string, 'easy' | 'medium' | 'hard'> = {
        'Easy': 'easy',
        'Medium': 'medium',
        'Hard': 'hard'
      };
      
      // Starter Code
      const starterCode: Record<string, string> = {};
      if (q.codeSnippets) {
        q.codeSnippets.forEach(s => {
          if (s.langSlug === 'python3') starterCode.python = s.code;
          if (s.langSlug === 'javascript') starterCode.javascript = s.code;
          if (s.langSlug === 'typescript') starterCode.typescript = s.code;
          if (s.langSlug === 'cpp') starterCode.cpp = s.code;
          if (s.langSlug === 'java') starterCode.java = s.code;
          if (s.langSlug === 'c') starterCode.c = s.code;
          if (s.langSlug === 'csharp') starterCode.csharp = s.code;
          if (s.langSlug === 'ruby') starterCode.ruby = s.code;
          if (s.langSlug === 'golang') starterCode.go = s.code;
          if (s.langSlug === 'rust') starterCode.rust = s.code;
          if (s.langSlug === 'php') starterCode.php = s.code;
        });
      } else {
        starterCode.python = '# Code not available for this problem';
      }

      // Category
      let category = 'algorithms';
      if (q.topicTags && Array.isArray(q.topicTags) && q.topicTags.length > 0) {
          category = q.topicTags[0].slug || q.topicTags[0].name || 'algorithms';
      }
      if (!category) category = 'algorithms'; // Double check

      // Upsert
      try {
        const existing = await prisma.problem.findUnique({ where: { slug } });
        
        let problemData = {
            frontendId: parseInt(q.questionFrontendId) || 0,
            title: q.title,
            slug: slug,
            description: q.content || `<p>${q.isPaidOnly ? 'Premium Problem. Description not available.' : 'No description available.'}</p>`,
            difficulty: diffMap[q.difficulty] || 'medium',
            category: category,
            starterCode: JSON.stringify(starterCode),
            isPublished: true,
            // We preserve existing companies tags if we are updating
        };

        if (existing) {
             // Update - usually requested to refresh
             await prisma.problem.update({
                 where: { id: existing.id },
                 data: problemData
             });
             updated++;
        } else {
             await prisma.problem.create({
                 data: {
                     ...problemData,
                     companies: [], // Default empty, syncCompanies script will fill this
                 }
             });
             created++;
        }
        
        count++;
        if (count % 100 === 0) console.log(`Processed ${count} problems...`);

      } catch (e) {
          console.error(`Failed to process ${q.title}:`, e instanceof Error ? e.message : e);
      }
    }

    console.log(`Sync Complete!`);
    console.log(`Total Processed: ${count}`);
    console.log(`Created: ${created}`);
    console.log(`Updated: ${updated}`);

  } catch (error) {
    console.error('Download or Sync failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

sync();
