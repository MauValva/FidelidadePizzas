import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/require-admin";

export async function GET() {
  const user = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { name, whatsapp, block, apartment } = body ?? {};

  if (!name || !whatsapp || !block || !apartment) {
    return NextResponse.json(
      { error: "Nome, WhatsApp, bloco e apartamento são obrigatórios." },
      { status: 400 }
    );
  }

  const uniqueToken = nanoid(21);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("customers")
    .insert({ name, whatsapp, block, apartment, unique_token: uniqueToken })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
