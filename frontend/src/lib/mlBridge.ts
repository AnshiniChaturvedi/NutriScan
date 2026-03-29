import { execFile } from 'node:child_process';
import * as path from 'path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function candidatePythonBins(): string[] {
  // Hardcoded venv path for reliability
  const hardcodedVenvPath = 'c:\\Users\\Shikhar\\OneDrive\\Desktop\\sem4_projects\\NutriScan\\.venv\\Scripts\\python.exe';
  
  // Dynamic resolution as backup
  const frontendDir = path.resolve(process.cwd());
  const nutriscanDir = path.resolve(frontendDir, '..');
  const projectRoot = path.resolve(nutriscanDir, '..');
  const dynamicVenvPath = path.join(projectRoot, '.venv', 'Scripts', 'python.exe');

  const bins = [
    // Environment variable override
    process.env.PYTHON_BIN,
    // Hardcoded path (most reliable on Windows)
    hardcodedVenvPath,
    // Dynamic path detection
    dynamicVenvPath,
    // Unix alternatives
    path.join(projectRoot, '.venv', 'bin', 'python3'),
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
