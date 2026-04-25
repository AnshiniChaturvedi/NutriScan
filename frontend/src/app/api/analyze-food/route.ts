import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.NUTRISCAN_BACKEND_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://127.0.0.1:8000';

function mapBridgeErrorStatus(errorType: string, message: string): number {
  const t = errorType.toLowerCase();
  const m = message.toLowerCase();

  if (t === 'product_not_found' || m.includes('product not found')) {
    return 404;
  }

  if (
    m.includes('timed out') ||
    m.includes('timeout') ||
    m.includes('temporarily unavailable') ||
    m.includes('connection') ||
    m.includes('name resolution')
  ) {
    return 503;
  }

  return 500;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const barcode = String(body?.barcode || '').trim();
    const productName = String(body?.product_name || '').trim();

    if (!barcode && !productName) {
      return NextResponse.json({ error: "Provide either 'barcode' or 'product_name'." }, { status: 422 });
    }

    if (barcode && !/^\d{8,14}$/.test(barcode)) {
      return NextResponse.json({ error: 'Barcode must be 8 to 14 digits.' }, { status: 422 });
    }

    if (productName && (productName.length < 2 || productName.length > 120)) {
      return NextResponse.json({ error: 'Product name must be between 2 and 120 characters.' }, { status: 422 });
    }

    const backendBody = JSON.stringify({
      ...(barcode ? { barcode } : {}),
      ...(productName ? { product_name: productName } : {}),
    });

    const backendResponse = await fetch(`${BACKEND_URL}/analyze-food`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: backendBody,
    });
    const payload = (await backendResponse.json().catch(() => ({}))) as Record<string, unknown>;

    if (!backendResponse.ok) {
      const message = String(payload.detail || payload.error || 'Analysis failed');
      const status = mapBridgeErrorStatus('backend_error', message);
      return NextResponse.json({ error: message, error_type: 'backend_error' }, { status });
    }
    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json({ error: `Analyze failed: ${String(err)}` }, { status: 500 });
  }
}
