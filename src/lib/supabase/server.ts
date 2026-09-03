import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente "de sessão": usa a chave pública (anon) + os cookies da
 * requisição para saber se existe um admin logado. Use este cliente
 * apenas para checar autenticação (auth.getUser()) — não para ler/
 * escrever dados de negócio, já que ele respeita RLS e não temos
 * nenhuma policy liberando acesso direto.
 */
export async function createServerAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server Components não podem escrever cookies — o middleware cuida disso.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // idem acima
          }
        },
      },
    }
  );
}
