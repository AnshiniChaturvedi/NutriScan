import { execFile } from 'node:child_process';
import * as path from 'path';
import { promisify } from 'node:util';
import * as fs from 'node:fs';

const execFileAsync = promisify(execFile);

type PythonCandidate = {
  bin: string;
  prefixArgs: string[];
};

function candidatePythonBins(): PythonCandidate[] {
  // Repo layout assumption:
  // - this runs in `frontend/`
  // - project root is `../` (NutriScan)
  const frontendDir = path.resolve(process.cwd());
  const projectRoot = path.resolve(frontendDir, '..');

  const winVenv = path.join(projectRoot, '.venv', 'Scripts', 'python.exe');
  const unixVenv = path.join(projectRoot, '.venv', 'bin', 'python3');

  const candidates: PythonCandidate[] = [];

  // 1) Explicit env var (supports full path)
  if (process.env.PYTHON_BIN) candidates.push({ bin: process.env.PYTHON_BIN, prefixArgs: [] });

  // 2) Project venv (best on Windows)
  if (fs.existsSync(winVenv)) candidates.push({ bin: winVenv, prefixArgs: [] });

  // 3) Project venv (unix)
  if (fs.existsSync(unixVenv)) candidates.push({ bin: unixVenv, prefixArgs: [] });

  // 4) Windows Python launcher (avoids Microsoft Store "python"/"python3" alias issues)
  if (process.platform === 'win32') {
    candidates.push({ bin: 'py', prefixArgs: ['-3'] });
  }

  // 5) System Python fallbacks
  candidates.push({ bin: 'python', prefixArgs: [] });
  candidates.push({ bin: 'python3', prefixArgs: [] });

  return candidates;
}

function scriptPath(): string {
  return path.resolve(process.cwd(), '..', 'ml', 'ingredient_model', 'frontend_infer.py');
}

export async function runMlBridge(args: string[]): Promise<any> {
  const script = scriptPath();
  const bins = candidatePythonBins();

  let lastError: unknown = null;

  for (const cand of bins) {
    try {
      const { stdout, stderr } = await execFileAsync(cand.bin, [...cand.prefixArgs, script, ...args], {
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
      console.error(`[ML Bridge] Failed with ${cand.bin}: ${err}`);
    }
  }

  throw new Error(`ML bridge execution failed: ${String(lastError)}`);
}
