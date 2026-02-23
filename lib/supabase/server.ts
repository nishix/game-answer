import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * API Route 等のサーバー側で使う Supabase クライアント。
 * リクエストごとに新しいクライアントを作成し、サーバー環境の env で確実に接続する。
 */
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です");
  }
  return createSupabaseClient(url, key);
}
