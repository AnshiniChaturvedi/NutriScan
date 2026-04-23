// ─── Backend API Types ───────────────────────────────────────────────────────

export interface Product {
  barcode: string;
  product_name: string | null;
  brand: string | null;
  image_url?: string | null;
  ingredients_text: string | null;
  nutriments: Record<string, number>;
}

export interface DiseaseRisk {
  risk: number;       // 0–1
  confidence: number; // 0–1
}

export interface ProcessingLevel {
  nova_group: string; // "1" | "2" | "3" | "4" | "unknown"
  label: string;
  description: string;
  health_note: string;
  source: 'openfoodfacts' | 'inferred' | 'unknown';
}

export interface AgeGroupImpact {
  label: string;
  risk_level: 'low' | 'moderate' | 'high' | 'very_high';
  notes: string;
}

export interface ConsumptionDisclaimer {
  recommended_frequency: string;
  general_guidance: string;
  specific_warnings: string;
  disclaimer: string;
}

export interface AnalyzeResponse {
  product: Product;
  health_score: number;               // 0–100
  disease_risks: Record<string, DiseaseRisk>;
  processing_level: ProcessingLevel;
  age_group_impacts: Record<string, AgeGroupImpact>;
  consumption_disclaimer: ConsumptionDisclaimer;
  ingredient_analysis: string | null; // Markdown string
}

export interface RecommendationItem {
  product: Product;
  health_score: number;
  disease_risks: Record<string, DiseaseRisk>;
  product_url?: string | null;
  buy_links?: {
    label: string;
    url: string;
  }[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
  search_count: number;
}

export interface AuthSession {
  token_type: 'bearer';
  access_token: string;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest extends LoginRequest {
  name: string;
}

export interface SearchHistoryCreate {
  query: string;
  query_type: string;
  product_name?: string | null;
  barcode?: string | null;
  result_summary?: Record<string, unknown> | null;
}

export interface SearchHistoryItem {
  id: string;
  user_id: string;
  query: string;
  query_type: string;
  product_name?: string | null;
  barcode?: string | null;
  result_summary?: Record<string, unknown> | null;
  created_at: string;
}

// ─── UI Helpers ──────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'moderate' | 'high' | 'very_high';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
