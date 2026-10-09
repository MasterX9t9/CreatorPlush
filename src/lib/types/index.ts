export type MetricSource =
  | "youtube_data_api"
  | "youtube_analytics_api"
  | "internal_calculation"
  | "statistical_estimate"
  | "ai_inference";

export type MetricDataType =
  | "official"
  | "calculated"
  | "estimated"
  | "ai_derived";

export interface MetricAttribution {
  source: MetricSource;
  dataType: MetricDataType;
  timestamp: string;
  confidence: number;
}

export interface AttributedMetric<T> {
  value: T;
  attribution: MetricAttribution;
  notes?: string;
}

export type OutlierTier =
  | "normal"
  | "2x"
  | "5x"
  | "10x"
  | "20x_plus";

export interface OutlierAnalysis {
  actualViews: number;
  expectedViews: number;
  multiplier: number;
  tier: OutlierTier;
  confidence: number;
  formula: string;
}

export interface RevenueEstimate {
  estimatedMonthlyViews: number;
  rpmMin: number;
  rpmMax: number;
  monthlyRevenueMin: number;
  monthlyRevenueMax: number;
  currency: string;
  isOfficial: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    status: number;
    details?: Record<string, unknown>;
  };
  metadata?: MetricAttribution;
  pagination?: {
    page: number;
    limit: number;
    totalCount?: number;
    hasMore: boolean;
  };
}

export interface WorkspaceContext {
  userId: string;
  workspaceId: string;
  role: "OWNER" | "ADMIN" | "EDITOR" | "ANALYST" | "VIEWER";
  planTier: "FREE" | "CREATOR" | "PRO" | "AGENCY";
}
