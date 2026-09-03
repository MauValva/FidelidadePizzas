import { createClient } from "@supabase/supabase-js";

/**
 * Cliente "administrativo": usa a service_role key, que ignora RLS.
 * Isso SÓ pode ser importado em código que roda no servidor (rotas de
 * API, Server Components) — nunca em um componente "use client".
 * A service_role key nunca deve começar com NEXT_PUBLIC_, exatamente
 * para não vazar no bundle do navegador.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
