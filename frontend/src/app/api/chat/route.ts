import { NextRequest, NextResponse } from 'next/server';

type ChatProductContext = {
  product?: {
    product_name?: string | null;
    brand?: string | null;
    nutriments?: Record<string, number>;
  };
  health_score?: number;
  disease_risks?: Record<string, unknown>;
  processing_level?: {
    label?: string;
  };
};

function toProductContext(value: unknown): ChatProductContext | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return value as ChatProductContext;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const question = String(body.question ?? '').trim();
  const productContext = toProductContext(body.productContext);

  if (!question) {
    return NextResponse.json({ error: 'Missing question.' }, { status: 400 });
  }

  if (question.length > 500) {
    return NextResponse.json({ error: 'Question is too long. Keep it under 500 characters.' }, { status: 422 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      answer: 'Chat assistant is not configured. Please set GEMINI_API_KEY in your .env.local file.',
    });
  }

  const contextSummary = productContext
    ? `Product: "${productContext.product?.product_name ?? 'Unknown'}" (${productContext.product?.brand ?? ''})
Health score: ${productContext.health_score}/100
Disease risks: ${JSON.stringify(productContext.disease_risks ?? {})}
Processing: ${productContext.processing_level?.label ?? 'N/A'}
Nutriments: ${JSON.stringify(productContext.product?.nutriments ?? {})}`
    : 'No product context available. Answer based on general nutrition knowledge.';

  const prompt = `You are a helpful, concise nutrition expert assistant for NutriScan AI.
${contextSummary}

User question: ${question}

Answer in 2-4 sentences, focusing on practical health advice. Do not fabricate specific data not in the context.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
        }),
        signal: controller.signal,
      }
    ).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      const err = await res.text();
      console.error('Gemini API error:', err);
      return NextResponse.json({ answer: 'The AI service returned an error. Please try again.' });
    }

    const data = await res.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response generated.';
    return NextResponse.json({ answer });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json({ answer: 'Failed to reach the AI service. Check your connection.' });
  }
}
