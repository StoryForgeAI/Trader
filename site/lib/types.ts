export type ThemeMode = 'dark' | 'light';

export type UserProfile = {
  id: string;
  email: string;
  credits: number;
  plan: string;
  created_at: string;
};

export type SubscriptionInfo = {
  user_id: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  plan: string;
  status: string;
  current_period_end: string | null;
  last_credit_refill_at: string | null;
};

export type ResellAnalysis = {
  productName: string;
  category: string;
  productSummary: string;
  estimatedPrice: string;
  recommendedSellPrice: string;
  expectedProfitRange: string;
  demandLevel: 'low' | 'medium' | 'high';
  conditionNotes: string;
  keySellingPoints: string[];
  adScript: string;
  aliExpressSearchUrl: string;
  confidenceScore: number;
  demandScore: number;
  marginScore: number;
  resaleSpeedScore: number;
};

export type AnalysisRecord = {
  id: string;
  image_url: string;
  result: ResellAnalysis;
  created_at: string;
};

export type DashboardData = {
  profile: UserProfile;
  subscription: SubscriptionInfo | null;
  analyses: AnalysisRecord[];
};

export type CheckoutProduct = {
  id: string;
  title: string;
  priceLabel: string;
  description: string;
  mode: 'payment';
  badge?: string;
};
