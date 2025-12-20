
import { LeetCodeSyncService } from '../src/services/leetcodeSync';

async function main() {
  const service = new LeetCodeSyncService();
  console.log('Testing LeetCode Sync...');
  
  try {
    const problems = await service.fetchProblemList(1, 0);
    if (problems.length > 0) {
      const p = problems[0];
      console.log(`Fetched problem metadata: ${p.title} (${p.questionFrontendId})`);
      
      const detail = await service.fetchProblemDetail(p.titleSlug);
      if (detail) {
        console.log('Fetched details from LeetCode GraphQL.');
        
        // Correct URL format: https://raw.githubusercontent.com/kamyu104/LeetCode-Solutions/master/Python/<slug>.py
        const githubUrl = `https://raw.githubusercontent.com/kamyu104/LeetCode-Solutions/master/Python/${p.titleSlug}.py`;
        console.log(`Testing GitHub URL: ${githubUrl}`);
        
        try {
            const axios = require('axios');
            const res = await axios.get(githubUrl);
            console.log('GitHub Fetch Status:', res.status);
            console.log('Snippet Length:', res.data.length);
        } catch (e: any) {
            console.error('GitHub Fetch Failed:', e.message);
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
}

main();
