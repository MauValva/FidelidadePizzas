export const FLAVORS = [
  { id: "calabresa", name: "Calabresa" },
  { id: "mussarela", name: "Mussarela" },
  { id: "mista", name: "Mista" },
] as const;

export type FlavorId = (typeof FLAVORS)[number]["id"];

export const PIZZA_PRICE = 35;
export const LOYALTY_GOAL = 10;

export type OrderItem = {
  flavor: FlavorId;
  quantity: number;
};

export type PublicCustomer = {
  id: string;
  name: string;
  block: string;
  apartment: string;
  loyaltyPoints: number;
  rewardAvailable: boolean;
  uniqueToken: string;
};

export type TransactionType = "purchase" | "correction" | "reward_redeemed";

// Formato "cru" como vem do Supabase (colunas em snake_case)
export type CustomerListItem = {
  id: string;
  name: string;
  whatsapp: string;
  block: string;
  apartment: string;
  loyalty_points: number;
  reward_available: boolean;
  total_pizzas: number;
  unique_token: string;
  created_at: string;
  updated_at: string;
};

export type HistoryItem = {
  id: string;
  type: TransactionType;
  points: number;
  balance_after: number;
  description: string | null;
  created_at: string;
};
