import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/require-admin";
import { getNotificationService } from "@/lib/notifications";
import { LOYALTY_GOAL } from "@/types";

type ActionBody = { action: "add" | "remove" | "redeem" };

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { action } = (await req.json()) as ActionBody;
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: customer, error: fetchError } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !customer) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const notifier = getNotificationService();

  if (action === "add") {
    if (customer.loyalty_points >= LOYALTY_GOAL) {
      return NextResponse.json(
        { error: "Cliente já atingiu o máximo de pontos. Resgate a recompensa antes de adicionar mais." },
        { status: 400 }
      );
    }

    const newPoints = customer.loyalty_points + 1;
    const rewardAvailable = newPoints >= LOYALTY_GOAL;

    const { data: updated, error: updateError } = await supabase
      .from("customers")
      .update({
        loyalty_points: newPoints,
        reward_available: rewardAvailable,
        total_pizzas: customer.total_pizzas + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", customer.id)
      .select()
      .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    await supabase.from("loyalty_transactions").insert({
      customer_id: customer.id,
      type: "purchase",
      points: 1,
      balance_after: newPoints,
    });

    const notifiable = {
      name: updated.name,
      whatsapp: updated.whatsapp,
      loyaltyPoints: updated.loyalty_points,
      uniqueToken: updated.unique_token,
    };
    const notifyPromise = rewardAvailable
      ? notifier.notifyRewardUnlocked(notifiable)
      : notifier.notifyLoyaltyUpdate(notifiable);
    notifyPromise.catch((e) => console.error("notify error", e));

    return NextResponse.json(updated);
  }

  if (action === "remove") {
    if (customer.loyalty_points <= 0) {
      return NextResponse.json({ error: "O saldo já está em zero." }, { status: 400 });
    }

    const newPoints = customer.loyalty_points - 1;

    const { data: updated, error: updateError } = await supabase
      .from("customers")
      .update({
        loyalty_points: newPoints,
        reward_available: false,
        total_pizzas: Math.max(0, customer.total_pizzas - 1),
        updated_at: new Date().toISOString(),
      })
      .eq("id", customer.id)
      .select()
      .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json(updated);
  }

  if (action === "redeem") {
    if (!customer.reward_available) {
      return NextResponse.json({ error: "Este cliente não tem recompensa disponível." }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabase
      .from("customers")
      .update({ loyalty_points: 0, reward_available: false, updated_at: new Date().toISOString() })
      .eq("id", customer.id)
      .select()
      .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    await supabase.from("loyalty_transactions").insert({
      customer_id: customer.id,
      type: "reward_redeemed",
      points: 0,
      description: "Recompensa resgatada",
      balance_after: 0,
    });

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}
