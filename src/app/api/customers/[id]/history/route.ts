import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/require-admin";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const supabase = createAdminClient();
  const { id } = await params;
  const { data, error } = await supabase
    .from("loyalty_transactions")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
