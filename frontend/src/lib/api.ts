import axios from 'axios';
import type { AnalyzeResponse, Product, RecommendationItem } from './types';

// Frontend calls local Next.js API routes, which proxy to FastAPI backend ML endpoints.
const BASE_URL = '';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 45000,
  headers: { 'Content-Type': 'application/json' },
});

function toApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }
  const maybe = payload as Record<string, unknown>;
  if (typeof maybe.error === 'string' && maybe.error.trim()) {
    return maybe.error;
  }
  if (typeof maybe.detail === 'string' && maybe.detail.trim()) {
    return maybe.detail;
  }
  return fallback;
}

function isAnalyzeResponse(payload: unknown): payload is AnalyzeResponse {
  if (!payload || typeof payload !== 'object') return false;
  const obj = payload as Record<string, unknown>;
  return !!obj.product && typeof obj.product === 'object';
}

/**
 * Fetch basic product details by barcode (no ML analysis).
 */
export async function scanProduct(barcode: string): Promise<Product | null> {
  try {
    const { data } = await api.post<Product>('/api/scan-product', { barcode });
    return data;
  } catch {
    return null;
  }
}

/**
 * Run full ML + LLM analysis for a product.
 * Accepts either a barcode (numeric string) or a product name.
 */
export async function analyzeFood(query: string): Promise<AnalyzeResponse> {
  const isBarcode = /^\d+$/.test(query.trim());
  const body = isBarcode
    ? { barcode: query.trim() }
    : { product_name: query.trim() };
  // First inference can be slow due to model/OCR warm-up.
  const { data } = await api.post('/api/analyze-food', body, { timeout: 120000 });
  if (!isAnalyzeResponse(data)) {
    throw new Error(toApiErrorMessage(data, 'Invalid analysis response from server.'));
  }
  return data;
}

/**
 * Fetch healthier alternative recommendations for a given barcode.
 */
export async function getRecommendations(barcode: string): Promise<RecommendationItem[]> {
  try {
    const { data } = await api.get<RecommendationItem[]>('/api/recommendations', {
      params: { barcode },
    });
    return data;
  } catch {
    return [];
  }
}

/**
 * Analyze a food product from an uploaded image.
 * The image may show a barcode OR a nutrition/ingredients label.
 */
export async function analyzeFromImage(file: File): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await axios.post(
    '/api/analyze-image',
    formData,
    { timeout: 60000 },
  );
  if (!isAnalyzeResponse(data)) {
    throw new Error(toApiErrorMessage(data, 'Image analysis failed.'));
  }
  return data;
}

// ─── Color Helpers ───────────────────────────────────────────────────────────

export function healthScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#84cc16';
  if (score >= 40) return '#eab308';
  if (score >= 20) return '#f97316';
  return '#ef4444';
}

export function healthScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Moderate';
  if (score >= 20) return 'Poor';
  return 'Very Unhealthy';
}

export function riskColor(risk: number): string {
  if (risk < 0.25) return '#22c55e';
  if (risk < 0.5)  return '#eab308';
  if (risk < 0.75) return '#f97316';
  return '#ef4444';
}

export function riskLabel(risk: number): string {
  if (risk < 0.25) return 'Low';
  if (risk < 0.5)  return 'Moderate';
  if (risk < 0.75) return 'High';
  return 'Very High';
}

export function novaColor(group: string): string {
  const n = parseInt(group);
  if (n === 1) return '#22c55e';
  if (n === 2) return '#84cc16';
  if (n === 3) return '#eab308';
  if (n === 4) return '#ef4444';
  return '#94a3b8';
}

export function ageLevelColor(level: string): string {
  switch (level) {
    case 'low':       return '#22c55e';
    case 'moderate':  return '#eab308';
    case 'high':      return '#f97316';
    case 'very_high': return '#ef4444';
    default:          return '#94a3b8';
  }
}

export function nutrientColor(key: string, value: number): string {
  // FSA traffic-light thresholds per 100g
  const thresholds: Record<string, [number, number]> = {
    sugar_100g:         [5,  22.5],
    fat_100g:           [3,  17.5],
    saturated_fat_100g: [1.5, 5],
    salt_100g:          [0.3, 1.5],
    energy_kcal:        [100, 450],
    fiber_100g:         [0,   6],   // Higher is better
    additives_count:    [0,   5],
  };
  const t = thresholds[key];
  if (!t) return '#94a3b8';
  const [low, high] = t;
  // Fiber is inverted (higher = better)
  if (key === 'fiber_100g') {
    if (value >= high)  return '#22c55e';
    if (value >= low)   return '#eab308';
    return '#ef4444';
  }
  if (value <= low)  return '#22c55e';
  if (value <= high) return '#eab308';
  return '#ef4444';
}
