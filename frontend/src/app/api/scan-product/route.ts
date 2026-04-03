import { NextRequest, NextResponse } from 'next/server';

import { runMlBridge } from '@/lib/mlBridge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const barcode = String(body?.barcode || '').trim();

    if (!barcode) {
      return NextResponse.json({ error: 'Missing barcode.' }, { status: 400 });
    }

    const product = await runMlBridge(['scan', '--barcode', barcode]);
    if (product && typeof product === 'object' && 'error' in product) {
      const message = String((product as { error?: string }).error || 'Product not found');
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (err) {
    return NextResponse.json({ error: `Scan failed: ${String(err)}` }, { status: 500 });
  }
}
