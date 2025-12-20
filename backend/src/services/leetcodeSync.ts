import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LEETCODE_API_ENDPOINT = 'https://leetcode.com/graphql';

interface LeetCodeProblem {
  questionFrontendId: string;
  title: string;
  titleSlug: string;
  difficulty: string;
  topicTags: { name: string; slug: string }[];
  isPaidOnly: boolean;
}

interface LeetCodeProblemDetail {
  questionId: string;
  title: string;
  titleSlug: string;
  content: string; // HTML description
  difficulty: string;
  topicTags: { name: string; slug: string }[];
  codeSnippets: { lang: string; langSlug: string; code: string }[];
  exampleTestcases: string; // Raw string of example test cases
  hints: string[];
}

export class LeetCodeSyncService {
  async fetchProblemList(limit = 20, skip = 0): Promise<LeetCodeProblem[]> {
    const query = `
      query problemsetQuestionList($limit: Int, $skip: Int) {
        problemsetQuestionList: questionList(
          categorySlug: ""
          limit: $limit
          skip: $skip
          filters: {}
        ) {
          questions: data {
            questionFrontendId
            title
            titleSlug
            difficulty
            isPaidOnly
            topicTags {
              name
              slug
            }
          }
        }
      }
    `;

    try {
      const response = await axios.post(LEETCODE_API_ENDPOINT, {
        query,
        variables: { limit, skip },
      });

      return response.data.data.problemsetQuestionList.questions;
    } catch (error) {
      console.error('Error fetching problem list:', error);
      throw error;
    }
  }

  async fetchProblemDetail(titleSlug: string): Promise<LeetCodeProblemDetail | null> {
    const query = `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          title
          titleSlug
          content
          difficulty
          topicTags {
            name
            slug
          }
          codeSnippets {
            lang
            langSlug
            code
          }
          exampleTestcases
          hints
        }
      }
    `;

    try {
      const response = await axios.post(LEETCODE_API_ENDPOINT, {
        query,
        variables: { titleSlug },
      });

      return response.data.data.question;
    } catch (error) {
      console.error(`Error fetching detail for ${titleSlug}:`, error);
      return null;
    }
  }

  async syncProblems(count = 10) {
    console.log(`Starting sync of top ${count} problems...`);
    const problems = await this.fetchProblemList(count, 0);

    for (const p of problems) {
      if (p.isPaidOnly) continue; // Skip paid problems

      console.log(`Syncing: ${p.title}`);
      const detail = await this.fetchProblemDetail(p.titleSlug);

      if (!detail) continue;

      // Transform difficulty to match our enum
      const difficultyMap: Record<string, 'easy' | 'medium' | 'hard'> = {
        Easy: 'easy',
        Medium: 'medium',
        Hard: 'hard',
      };

      // Transform code snippets to our format
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

      // Fetch solution from GitHub (kamyu104)
      let solutionCode = { ...starterCode };
      try {
        // Correct URL format: https://raw.githubusercontent.com/kamyu104/LeetCode-Solutions/master/Python/<slug>.py
        const githubUrl = `https://raw.githubusercontent.com/kamyu104/LeetCode-Solutions/master/Python/${p.titleSlug}.py`;
        
        console.log(`Fetching solution from: ${githubUrl}`);
        const ghResponse = await axios.get(githubUrl);
        if (ghResponse.data) {
           // We found a solution!
           solutionCode = {
             ...starterCode,
             python: ghResponse.data 
           };
        }
      } catch (err) {
        // Ignore 404s, widely expected for newer/renamed problems
         console.warn(`No GitHub solution for ${p.title}`);
      }

      // Upsert into DB
      const problem = await prisma.problem.upsert({
        where: { slug: p.titleSlug },
        update: {
          title: p.title,
          description: detail.content,
          difficulty: difficultyMap[detail.difficulty] || 'medium',
          category: detail.topicTags[0]?.slug || 'algorithms',
          starterCode: JSON.stringify(starterCode),
          // We don't have a `solutionCode` column in the recent schema view?
          // Let's assume we put it in seed.ts, so it must exist. 
          // Re-checking seed.ts content from earlier logs...
          // seed.ts: solutionCode: JSON.stringify({...})
          // So the model Problem has solutionCode.
          solutionCode: JSON.stringify(solutionCode), // Update solution code
          hints: JSON.stringify(detail.hints),
        },
        create: {
          title: p.title,
          slug: p.titleSlug,
          description: detail.content,
          difficulty: difficultyMap[detail.difficulty] || 'medium',
          category: detail.topicTags[0]?.slug || 'algorithms',
          starterCode: JSON.stringify(starterCode),
          solutionCode: JSON.stringify(solutionCode),
          hints: JSON.stringify(detail.hints),
          isPublished: true,
        },
      });
      
      console.log(`Synced ${p.title} (${problem.id})`);
    }
    
    console.log('Sync complete!');
  }
  async syncFromExternalJSON() {
    console.log('Starting sync from external JSON...');
    const JSON_URL = 'https://raw.githubusercontent.com/noworneverev/leetcode-api/master/data/leetcode_questions.json';
    
    try {
      // Stream or large fetch
      const { data } = await axios.get(JSON_URL, {
        maxContentLength: 50 * 1024 * 1024,
        maxBodyLength: 50 * 1024 * 1024
      });

      console.log(`Downloaded dataset. Processing ${data.length} items...`);
      
      const diffMap: Record<string, 'easy' | 'medium' | 'hard'> = {
        'Easy': 'easy', 'Medium': 'medium', 'Hard': 'hard'
      };

      let count = 0;
      for (const item of data) {
         const q = item.data?.question;
         if (!q) continue;
         
         // Logic reused from syncFullJson.ts
         let slug = q.titleSlug;
         if (!slug && q.url) slug = q.url.split('/problems/')[1]?.replace(/\/$/, '');
         if (!slug) slug = q.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

         // Determine category
         let category = 'algorithms';
         if (q.topicTags && q.topicTags.length > 0) {
             category = q.topicTags[0].slug || q.topicTags[0].name || 'algorithms';
         }

         // Upsert (only if new or update needed)
         // Optimization: Maybe only create if missing? 
         // For "Update" feature, we want to add new problems.
         // Upsert is safer.
         
         const starterCode: Record<string, string> = {};
         if (q.codeSnippets) {
             q.codeSnippets.forEach((s: any) => {
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
             starterCode.python = '# Code not available';
         }

         await prisma.problem.upsert({
             where: { slug: slug },
             update: {
                 // Update starterCode to ensure we get new language mappings for existing problems
                 starterCode: JSON.stringify(starterCode),
                 // Also ensure description and title are up to date
                 title: q.title,
                 description: q.content,
                 slug: slug,
                 frontendId: parseInt(q.questionFrontendId) || 0,
             }, 
             create: {
                frontendId: parseInt(q.questionFrontendId) || 0,
                title: q.title,
                slug: slug,
                description: q.content || `<p>${q.isPaidOnly ? 'Premium Problem.' : 'No description.'}</p>`,
                difficulty: diffMap[q.difficulty] || 'medium',
                category: category,
                starterCode: JSON.stringify(starterCode),
                isPublished: true,
                companies: [], // synced separately
             }
         }).catch(() => {}); // catch race conditions or dupes specifically
         
         count++;
      }
      console.log(`JSON Sync complete. Processed ${count} items.`);
      return count;
    } catch (e) {
      console.error('JSON Sync failed:', e);
      throw e;
    }
  }
}
