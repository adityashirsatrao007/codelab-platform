import { spawn } from 'child_process';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuid } from 'uuid';
import { existsSync } from 'fs';

const TEMP_DIR = join(process.cwd(), 'temp');
const TIMEOUT_MS = 10000; // 10 seconds
const MAX_OUTPUT_SIZE = 1024 * 1024; // 1MB

interface ExecutionResult {
  output: string;
  error: string | null;
  runtime: number;
  exitCode: number;
}

// Language configurations
const LANGUAGE_CONFIG: Record<string, {
  extension: string;
  compile?: string[];
  run: string[];
}> = {
  python: {
    extension: '.py',
    run: ['python', '{file}'],
  },
  javascript: {
    extension: '.js',
    run: ['node', '{file}'],
  },
  cpp: {
    extension: '.cpp',
    compile: ['g++', '-o', '{output}', '{file}', '-std=c++17'],
    run: ['{output}'],
  },
  java: {
    extension: '.java',
    compile: ['javac', '{file}'],
    run: ['java', '-cp', '{dir}', 'Solution'],
  },
  c: {
    extension: '.c',
    compile: ['gcc', '-o', '{output}', '{file}'],
    run: ['{output}'],
  },
  csharp: {
    extension: '.cs',
    // C# execution on raw files is tricky without project, using script or basic csc if available.
    // Assuming dotnet script or single file compilation is available? 
    // Standard CSC:
    compile: ['csc', '-out:{output}', '{file}'],
    run: ['{output}'],
  },
  ruby: {
    extension: '.rb',
    run: ['ruby', '{file}'],
  },
  go: {
    extension: '.go',
    run: ['go', 'run', '{file}'],
  },
  typescript: {
    extension: '.ts',
    run: ['npx', 'ts-node', '{file}'],
  },
  rust: {
    extension: '.rs',
    compile: ['rustc', '{file}', '-o', '{output}'],
    run: ['{output}'],
  },
  php: {
    extension: '.php',
    run: ['php', '{file}'],
  },
};

async function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
  }
}

function runProcess(
  command: string,
  args: string[],
  input: string,
  cwd: string
): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let output = '';
    let errorOutput = '';
    let killed = false;

    const proc = spawn(command, args, {
      cwd,
      timeout: TIMEOUT_MS,
      shell: process.platform === 'win32',
    });

    // Set timeout
    const timer = setTimeout(() => {
      killed = true;
      proc.kill('SIGKILL');
    }, TIMEOUT_MS);

    proc.stdout.on('data', (data) => {
      if (output.length < MAX_OUTPUT_SIZE) {
        output += data.toString();
      }
    });

    proc.stderr.on('data', (data) => {
      if (errorOutput.length < MAX_OUTPUT_SIZE) {
        errorOutput += data.toString();
      }
    });

    // Write input
    if (input) {
      proc.stdin.write(input);
    }
    proc.stdin.end();

    proc.on('close', (code) => {
      clearTimeout(timer);
      const runtime = Date.now() - startTime;

      if (killed) {
        resolve({
          output: '',
          error: 'Time Limit Exceeded (timeout after 10 seconds)',
          runtime: TIMEOUT_MS,
          exitCode: -1,
        });
      } else {
        resolve({
          output,
          error: errorOutput || null,
          runtime,
          exitCode: code || 0,
        });
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        output: '',
        error: `Process error: ${err.message}`,
        runtime: Date.now() - startTime,
        exitCode: -1,
      });
    });
  });
}

export async function executeCode(
  code: string,
  language: string,
  input: string
): Promise<ExecutionResult> {
  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    return {
      output: '',
      error: `Unsupported language: ${language}`,
      runtime: 0,
      exitCode: -1,
    };
  }

  await ensureTempDir();
  
  const executionId = uuid();
  const executionDir = join(TEMP_DIR, executionId);
  await mkdir(executionDir, { recursive: true });

  const fileName = language === 'java' ? 'Solution' : `code_${executionId}`;
  const sourceFile = join(executionDir, fileName + config.extension);
  const outputFile = join(executionDir, fileName + (process.platform === 'win32' ? '.exe' : ''));

  try {
    // Write source code
    await writeFile(sourceFile, code);

    // Compile if needed
    if (config.compile) {
      const compileArgs = config.compile.slice(1).map((arg) =>
        arg
          .replace('{file}', sourceFile)
          .replace('{output}', outputFile)
      );

      const compileResult = await runProcess(
        config.compile[0],
        compileArgs,
        '',
        executionDir
      );

      if (compileResult.exitCode !== 0) {
        return {
          output: '',
          error: `Compilation Error:\n${compileResult.error || compileResult.output}`,
          runtime: compileResult.runtime,
          exitCode: compileResult.exitCode,
        };
      }
    }

    // Run
    const runArgs = config.run.slice(1).map((arg) =>
      arg
        .replace('{file}', sourceFile)
        .replace('{output}', outputFile)
        .replace('{dir}', executionDir)
    );

    const runCommand = config.run[0]
      .replace('{file}', sourceFile)
      .replace('{output}', outputFile);

    const result = await runProcess(runCommand, runArgs, input, executionDir);

    // Check for runtime errors
    if (result.exitCode !== 0 && !result.error) {
      result.error = `Runtime Error (exit code: ${result.exitCode})`;
    }

    return result;
  } finally {
    // Cleanup
    try {
      const { rm } = await import('fs/promises');
      await rm(executionDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
  }
}

// Check if required language runtimes are available
export async function checkLanguageSupport(): Promise<Record<string, boolean>> {
  const support: Record<string, boolean> = {};

  for (const [lang, config] of Object.entries(LANGUAGE_CONFIG)) {
    try {
      const result = await runProcess(
        config.run[0].replace('{output}', '').replace('{file}', ''),
        ['--version'],
        '',
        process.cwd()
      );
      support[lang] = result.exitCode === 0 || result.output.length > 0;
    } catch {
      support[lang] = false;
    }
  }

  return support;
}
