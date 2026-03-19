import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const LOGO_BUCKET = "clinic-logos";

// Lazy singleton — instanciado apenas na primeira chamada, nunca durante o build.
// Variáveis NEXT_PUBLIC_* são injetadas pela Vercel no momento do build,
// portanto devem existir em runtime mas podem ser undefined no bundle se o
// redeploy não foi feito após adicionar as env vars no painel da Vercel.
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "[DrVet] Supabase não configurado. " +
      "Adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY " +
      "nas variáveis de ambiente da Vercel e faça um novo deploy."
    );
  }

  _supabase = createClient(url, key);
  return _supabase;
}

// Alias para manter compatibilidade com código existente que usa `supabase` diretamente
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
