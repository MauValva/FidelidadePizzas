import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PIZZA_PRICE } from "@/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, items, rewardFlavor } = body ?? {};

  if (!token || !Array.isArray(items)) {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("unique_token", token)
    .single();

  if (customerError || !customer) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  const nonZeroItems = items.filter((i: { quantity: number }) => i.quantity > 0);
  const total = nonZeroItems.reduce(
    (sum: number, i: { quantity: number }) => sum + i.quantity * PIZZA_PRICE,
    0
  );

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: customer.id,
      items_json: nonZeroItems,
      reward_item: rewardFlavor ?? null,
      total,
    })
    .select()
    .single();

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });
  return NextResponse.json(order, { status: 201 });
}
