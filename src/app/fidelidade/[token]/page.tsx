import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { CustomerCard } from "@/components/CustomerCard";

export const dynamic = "force-dynamic";

export default async function FidelidadePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("unique_token", token)
    .single();

  if (!customer) {
    notFound();
  }

  const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();
  const businessPhone = settings?.business_phone ?? "";

  return (
    <CustomerCard
      customer={{
        id: customer.id,
        name: customer.name,
        block: customer.block,
        apartment: customer.apartment,
        loyaltyPoints: customer.loyalty_points,
        rewardAvailable: customer.reward_available,
        uniqueToken: customer.unique_token,
      }}
      businessPhone={businessPhone}
    />
  );
}
