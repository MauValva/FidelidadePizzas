import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/require-admin";

export async function GET() {
  const user = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const user = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { businessPhone, pixKey } = await req.json();
  if (!businessPhone) {
    return NextResponse.json({ error: "Telefone é obrigatório." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("settings")
    .update({
      business_phone: String(businessPhone).replace(/\D/g, ""),
      pix_key: String(pixKey ?? "").trim(),
    })
    .eq("id", 1)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
