import { NextRequest, NextResponse } from 'next/server';

import { runMlBridge } from '@/lib/mlBridge';

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
    const body = await req.json();
    const barcode = String(body?.barcode || '').trim();

    if (!barcode) {
      return NextResponse.json({ error: 'Missing barcode.' }, { status: 400 });
    }

    const product = await runMlBridge(['scan', '--barcode', barcode]);
    if (product && typeof product === 'object' && 'error' in product) {
      const payload = product as { error?: string; error_type?: string };
      const message = String(payload.error || 'Scan failed');
      const errorType = String(payload.error_type || 'bridge_error');
      const status = mapBridgeErrorStatus(errorType, message);
      return NextResponse.json({ error: message, error_type: errorType }, { status });
    }
    return NextResponse.json(product);
  } catch (err) {
    return NextResponse.json({ error: `Scan failed: ${String(err)}` }, { status: 500 });
  }
}
