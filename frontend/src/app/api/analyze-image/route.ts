import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.NUTRISCAN_BACKEND_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://127.0.0.1:8000';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
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

    const backendForm = new FormData();
    backendForm.append('image', image);

    const backendResponse = await fetch(`${BACKEND_URL}/analyze-image`, {
      method: 'POST',
      body: backendForm,
    });
    const payload = (await backendResponse.json().catch(() => ({}))) as Record<string, unknown>;

    if (!backendResponse.ok) {
      const message = String(payload.detail || payload.error || 'Image analysis failed');
      return NextResponse.json({ detail: message }, { status: backendResponse.status || 422 });
    }
    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json({ detail: `Image analysis failed: ${String(err)}` }, { status: 500 });
  }
}
