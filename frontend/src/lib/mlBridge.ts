import { execFile } from 'node:child_process';
import * as path from 'path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function candidatePythonBins(): string[] {
  const frontendDir = path.resolve(process.cwd());
  const appRoot = path.resolve(frontendDir, '..');
  const workspaceRoot = path.resolve(appRoot, '..');

  // Support both common locations:
  // 1) <repo>/nutriscan-ai/.venv
  // 2) <workspace>/.venv
  const venvInApp = path.join(appRoot, '.venv', 'Scripts', 'python.exe');
  const venvInWorkspace = path.join(workspaceRoot, '.venv', 'Scripts', 'python.exe');

  const bins = [
    // Environment variable override
    process.env.PYTHON_BIN,
    // Windows virtualenv candidates
    venvInApp,
    venvInWorkspace,
    // Unix alternatives
    path.join(appRoot, '.venv', 'bin', 'python3'),
    path.join(workspaceRoot, '.venv', 'bin', 'python3'),
    // System Python
    'python',
    'python3',
  ].filter(Boolean) as string[];

  return bins;
}

function scriptPath(): string {
  return path.resolve(process.cwd(), '..', 'ml', 'ingredient_model', 'frontend_infer.py');
}

export async function runMlBridge(args: string[]): Promise<any> {
  const script = scriptPath();
  const bins = candidatePythonBins();

  let lastError: unknown = null;

  for (const bin of bins) {
    try {
      const { stdout, stderr } = await execFileAsync(bin, [script, ...args], {
        cwd: path.resolve(process.cwd(), '..'),
        timeout: 300000,
        windowsHide: true,
        maxBuffer: 1024 * 1024 * 8,
        env: { ...process.env, PYTHONWARNINGS: 'ignore' },
      });

      const text = stdout.trim();
      if (!text) {
        throw new Error('ML bridge returned empty output');
      }

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        console.error('[ML Bridge] JSON parse error. stderr:', stderr);
        console.error('[ML Bridge] stdout:', text);
        throw e;
      }

      if (parsed && typeof parsed === 'object' && 'error' in parsed) {
        // Error from ML bridge is expected (e.g., product not found) - still return it
        return parsed;
      }
      return parsed;
    } catch (err) {
      lastError = err;
      console.error(`[ML Bridge] Failed with ${bin}: ${err}`);
    }
  }

  throw new Error(`ML bridge execution failed: ${String(lastError)}`);
}
