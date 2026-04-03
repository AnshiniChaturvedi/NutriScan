import { NextRequest, NextResponse } from 'next/server';

import { runMlBridge } from '@/lib/mlBridge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const barcode = String(body?.barcode || '').trim();
    const productName = String(body?.product_name || '').trim();

    if (!barcode && !productName) {
      return NextResponse.json({ error: "Provide either 'barcode' or 'product_name'." }, { status: 422 });
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
      const message = String((result as { error?: string }).error || 'Product not found');
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: `Analyze failed: ${String(err)}` }, { status: 500 });
  }
}
