import { createClient } from "@/lib/supabase/client";

export interface VoteRow {
  id: string;
  room_id: string;
  player_id: string;
  answer_id: string;
  created_at: string;
}

/** 投票を送信（既に同じ room+player の行があれば answer_id を更新＝付け替え） */
export async function submitVote(
  roomId: string,
  playerId: string,
  answerId: string
): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("votes")
    .upsert(
      { room_id: roomId, player_id: playerId, answer_id: answerId },
      { onConflict: "room_id,player_id" }
    );
  if (error) return { error: error.message };
  return {};
}

export async function getVotesByRoom(
  roomId: string
): Promise<VoteRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("votes")
    .select("id, room_id, player_id, answer_id, created_at")
    .eq("room_id", roomId);

  if (error) return [];
  return (data ?? []) as VoteRow[];
}

/** ラウンド切り替え時にそのルームの投票を削除 */
export async function deleteVotesByRoom(
  roomId: string
): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("votes")
    .delete()
    .eq("room_id", roomId);
  if (error) return { error: error.message };
  return {};
}
