-- Secret Answers: テーブル作成 + RLS
-- Supabase SQL エディターで実行してください。
-- 何度実行してもエラーにならないようにしてあります（ポリシーは DROP IF EXISTS してから作成）。

-- ============================================
-- 1. テーブル
-- ============================================

-- rooms: ルーム（フェーズ・お題・使用済みお題ID・参加用ショートコード10桁）
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  short_code text unique,
  status text not null default 'lobby' check (status in ('lobby', 'question', 'exposure', 'closeup', 'result')),
  current_question text not null default '',
  used_question_indices jsonb not null default '[]'
);
-- インデックスは「4. 既存DB用マイグレーション」で short_code 追加後に作成する（既存DBで列がないとエラーになるため）

-- players: プレイヤー（ルーム参加者）
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  name text not null,
  is_host boolean not null default false
);

create index if not exists players_room_id_idx on public.players(room_id);

-- answers: 回答（匿名表示用）
create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  content text not null
);

create index if not exists answers_room_id_idx on public.answers(room_id);

-- votes: 投票（1プレイヤー1票、付け替え時は answer_id を UPDATE）
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  answer_id uuid not null references public.answers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(room_id, player_id)
);

create index if not exists votes_room_id_idx on public.votes(room_id);

-- ============================================
-- 2. RLS 有効化
-- ============================================

alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.answers enable row level security;
alter table public.votes enable row level security;

-- ============================================
-- 3. ポリシー（anon でアプリから操作する想定）
-- 既に存在するポリシーは DROP してから作り直すので、何度実行してもOK
-- ============================================

-- rooms: 誰でも SELECT / INSERT / UPDATE / DELETE（全員退室時に削除）
drop policy if exists "rooms_select" on public.rooms;
drop policy if exists "rooms_insert" on public.rooms;
drop policy if exists "rooms_update" on public.rooms;
drop policy if exists "rooms_delete" on public.rooms;
create policy "rooms_select" on public.rooms for select to anon using (true);
create policy "rooms_insert" on public.rooms for insert to anon with check (true);
create policy "rooms_update" on public.rooms for update to anon using (true);
create policy "rooms_delete" on public.rooms for delete to anon using (true);

-- players: 誰でも SELECT / INSERT / UPDATE / DELETE（退室・ホスト譲渡用）
drop policy if exists "players_select" on public.players;
drop policy if exists "players_insert" on public.players;
drop policy if exists "players_update" on public.players;
drop policy if exists "players_delete" on public.players;
create policy "players_select" on public.players for select to anon using (true);
create policy "players_insert" on public.players for insert to anon with check (true);
create policy "players_update" on public.players for update to anon using (true);
create policy "players_delete" on public.players for delete to anon using (true);

-- answers: 誰でも SELECT / INSERT / DELETE（新ラウンド開始時にルーム単位で削除）
drop policy if exists "answers_select" on public.answers;
drop policy if exists "answers_insert" on public.answers;
drop policy if exists "answers_delete" on public.answers;
create policy "answers_select" on public.answers for select to anon using (true);
create policy "answers_insert" on public.answers for insert to anon with check (true);
create policy "answers_delete" on public.answers for delete to anon using (true);

-- votes: 誰でも SELECT / INSERT / UPDATE / DELETE（付け替えは UPDATE、ラウンド切り替えで DELETE）
drop policy if exists "votes_select" on public.votes;
drop policy if exists "votes_insert" on public.votes;
drop policy if exists "votes_update" on public.votes;
drop policy if exists "votes_delete" on public.votes;
create policy "votes_select" on public.votes for select to anon using (true);
create policy "votes_insert" on public.votes for insert to anon with check (true);
create policy "votes_update" on public.votes for update to anon using (true);
create policy "votes_delete" on public.votes for delete to anon using (true);

-- ============================================
-- 4. 既存DB用マイグレーション（テーブルはあるがカラム・制約が古い場合）
-- 既に適用済みなら何もしない（IF NOT EXISTS / DROP IF EXISTS）
-- ============================================
alter table public.rooms add column if not exists short_code text unique;
create index if not exists rooms_short_code_idx on public.rooms(short_code);
alter table public.rooms add column if not exists used_question_indices jsonb not null default '[]';
alter table public.rooms drop constraint if exists rooms_status_check;
alter table public.rooms add constraint rooms_status_check check (status in ('lobby','question','exposure','closeup','result'));

-- ============================================
-- 5. Realtime（Postgres Changes）について
-- ============================================
-- ダッシュボードで以下を有効にしてください:
--
-- Database → Replication
--   - public.rooms を ON（フェーズ同期）
--   - public.players を ON（ロビー参加者一覧のリアルタイム更新）
--   - public.answers を ON（全員回答で exposure へ自動遷移の判定用）
--   - public.votes を ON（全員投票で closeup へ自動遷移の判定用）
--
