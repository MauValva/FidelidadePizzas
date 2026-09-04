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
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await requireAdminUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { name, whatsapp, block, apartment } = body ?? {};
  const normalizedBlock = typeof block === "string" ? block.trim().toUpperCase() : "";
  const normalizedApartment = typeof apartment === "string" ? apartment.trim() : "";

  if (!name || !whatsapp || !normalizedBlock || !normalizedApartment) {
    return NextResponse.json(
      { error: "Nome, WhatsApp, bloco e apartamento são obrigatórios." },
      { status: 400 }
    );
  }

  const uniqueToken = nanoid(21);
  const supabase = createAdminClient();

  const { data: existingCustomer, error: duplicateCheckError } = await supabase
    .from("customers")
    .select("id")
    .eq("block", normalizedBlock)
    .eq("apartment", normalizedApartment)
    .maybeSingle();

  if (duplicateCheckError) return NextResponse.json({ error: duplicateCheckError.message }, { status: 500 });
  if (existingCustomer) {
    return NextResponse.json(
      { error: "Já existe um cliente cadastrado neste bloco e apartamento." },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({ name, whatsapp, block: normalizedBlock, apartment: normalizedApartment, unique_token: uniqueToken })
    .select()
    .single();

  if (error?.code === "23505") {
    return NextResponse.json(
      { error: "Já existe um cliente cadastrado neste bloco e apartamento." },
      { status: 409 }
    );
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
