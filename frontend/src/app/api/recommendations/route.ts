import { NextRequest, NextResponse } from 'next/server';

import { runMlBridge } from '@/lib/mlBridge';

export async function GET(req: NextRequest) {
  try {
    const barcode = req.nextUrl.searchParams.get('barcode')?.trim() || '';

    if (!barcode) {
      return NextResponse.json([], { status: 200 });
    }

    const result = await runMlBridge(['recommend', '--barcode', barcode, '--limit', '4']);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
