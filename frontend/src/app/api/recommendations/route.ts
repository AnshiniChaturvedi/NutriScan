import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.NUTRISCAN_BACKEND_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://127.0.0.1:8000';

type RecommendationRaw = {
  product?: {
    barcode?: string;
    product_name?: string | null;
    brand?: string | null;
  };
  health_score?: number;
  disease_risks?: Record<string, unknown>;
};

type PurchaseLink = {
  label: string;
  url: string;
};

function buildProductQuery(item: RecommendationRaw): string {
  const productName = item.product?.product_name?.trim() ?? '';
  const brand = item.product?.brand?.trim() ?? '';
  const barcode = item.product?.barcode?.trim() ?? '';

  const query = `${brand} ${productName}`.trim();
  if (query) return query;
  if (barcode) return barcode;
  return 'healthy food';
}

function buildPurchaseLinks(item: RecommendationRaw): PurchaseLink[] {
  const query = encodeURIComponent(buildProductQuery(item));

  return [
    {
      label: 'Amazon',
      url: `https://www.amazon.in/s?k=${query}`,
    },
    {
      label: 'Flipkart',
      url: `https://www.flipkart.com/search?q=${query}`,
    },
    {
      label: 'BigBasket',
      url: `https://www.bigbasket.com/ps/?q=${query}`,
    },
  ];
}

function enrichRecommendation(item: RecommendationRaw): RecommendationRaw & {
  product_url: string | null;
  buy_links: PurchaseLink[];
} {
  const barcode = item.product?.barcode?.trim() ?? '';

  return {
    ...item,
    product_url: barcode ? `https://world.openfoodfacts.org/product/${encodeURIComponent(barcode)}` : null,
    buy_links: buildPurchaseLinks(item),
  };
}

export async function GET(req: NextRequest) {
  try {
    const barcode = req.nextUrl.searchParams.get('barcode')?.trim() || '';

    if (!barcode) {
      return NextResponse.json([], { status: 200 });
    }

    if (!/^\d{8,14}$/.test(barcode)) {
      return NextResponse.json({ error: 'Invalid barcode format. Expected 8 to 14 digits.' }, { status: 422 });
    }

    const backendResponse = await fetch(
      `${BACKEND_URL}/recommendations?barcode=${encodeURIComponent(barcode)}`,
      { method: 'GET' },
    );

    if (!backendResponse.ok) {
      return NextResponse.json([], { status: 200 });
    }

    const result = await backendResponse.json().catch(() => []);
    if (!Array.isArray(result)) {
      return NextResponse.json([], { status: 200 });
    }

    const enriched = result.map((item) => enrichRecommendation(item as RecommendationRaw));
    return NextResponse.json(enriched);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
