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

    const args = ['analyze'];
    if (barcode) {
      args.push('--barcode', barcode);
    }
    if (productName) {
      args.push('--product-name', productName);
    }

    const result = await runMlBridge(args);
    if (result && typeof result === 'object' && 'error' in result) {
      const payload = result as { error?: string; error_type?: string };
      const message = String(payload.error || 'Analysis failed');
      const errorType = String(payload.error_type || 'bridge_error');
      const status = mapBridgeErrorStatus(errorType, message);
      return NextResponse.json({ error: message, error_type: errorType }, { status });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: `Analyze failed: ${String(err)}` }, { status: 500 });
  }
}
