import { randomUUID } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { NextRequest, NextResponse } from 'next/server';

import { runMlBridge } from '@/lib/mlBridge';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let tempPath = '';
  try {
    const form = await req.formData();
    const image = form.get('image');

    if (!(image instanceof File)) {
      return NextResponse.json({ detail: 'Missing image file.' }, { status: 400 });
    }

    const maxBytes = 8 * 1024 * 1024;
    if (image.size <= 0 || image.size > maxBytes) {
      return NextResponse.json(
        { detail: 'Image size must be between 1 byte and 8 MB.' },
        { status: 413 },
      );
    }

    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/bmp': '.bmp',
    };
    const ext = mimeToExt[image.type.toLowerCase()];
    if (!ext) {
      return NextResponse.json(
        {
          detail: `Unsupported image format (${image.type || 'unknown'}). Use JPEG, PNG, WEBP, or BMP.`,
        },
        { status: 415 },
      );
    }

    const bytes = Buffer.from(await image.arrayBuffer());
    tempPath = path.join(os.tmpdir(), `nutriscan-${randomUUID()}${ext}`);
    await writeFile(tempPath, bytes);

    const result = await runMlBridge(['analyze-image', '--image', tempPath]);
    if (result && typeof result === 'object' && 'error' in result) {
      const message = String((result as { error?: string }).error || 'Image analysis failed');
      return NextResponse.json({ detail: message }, { status: 422 });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ detail: `Image analysis failed: ${String(err)}` }, { status: 500 });
  } finally {
    if (tempPath) {
      try {
        await unlink(tempPath);
      } catch {
        // Best effort cleanup.
      }
    }
  }
}
