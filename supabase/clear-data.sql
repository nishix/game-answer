-- ============================================
-- データのみ削除（テーブル・RLSは残す）
-- Supabase ダッシュボード → SQL Editor で実行
-- ============================================
-- 実行前に「本番（Vercel 連携）の Supabase プロジェクト」を選択してください。

-- 依存関係の順で削除（子 → 親）
-- votes → answers → players → rooms
TRUNCATE TABLE public.votes, public.answers, public.players, public.rooms;
