import { createServerAuthClient } from "@/lib/supabase/server";

/** Retorna o usuário logado (admin) ou null. */
export async function requireAdminUser() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
