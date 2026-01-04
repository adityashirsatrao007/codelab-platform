const { spawn } = require('child_process');

const variables = [
  { key: 'VITE_GOOGLE_CLIENT_ID', value: '725842201159-dv90d5c76kfe1s4mathfqvmalcuefac9.apps.googleusercontent.com' },
  { key: 'GOOGLE_CLIENT_ID', value: '725842201159-dv90d5c76kfe1s4mathfqvmalcuefac9.apps.googleusercontent.com' },
  { key: 'FRONTEND_URL', value: 'https://codelab-platform.vercel.app' }
];

async function setEnv(key, value) {
  return new Promise((resolve, reject) => {
    console.log(`Setting ${key}...`);
    // 'powershell' shell: true is important on Windows to find 'vercel' if it's a cmd/ps1 shim
    const child = spawn('vercel', ['env', 'add', key, 'production'], { shell: true });

    child.stdin.write(value);
    child.stdin.end();

    child.stdout.on('data', (data) => process.stdout.write(data));
    child.stderr.on('data', (data) => process.stderr.write(data));

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${key} set successfully.\n`);
        resolve();
      } else {
        console.error(`❌ Failed to set ${key}, code ${code}\n`);
        reject();
      }
    });
  });
}

async function main() {
  for (const v of variables) {
    try {
      await setEnv(v.key, v.value);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }
}

main();
