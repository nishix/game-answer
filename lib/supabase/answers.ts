import { createClient } from "@/lib/supabase/client";

export interface AnswerRow {
  id: string;
  room_id: string;
  player_id: string;
  content: string;
}

export async function submitAnswer(
  roomId: string,
  playerId: string,
  content: string
): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("answers").insert({
    room_id: roomId,
    player_id: playerId,
    content: content.trim(),
  });
  if (error) return { error: error.message };
  return {};
}

export async function getAnswersByRoom(
  roomId: string
): Promise<AnswerRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("answers")
    .select("id, room_id, player_id, content")
    .eq("room_id", roomId)
    .order("id", { ascending: true });

  if (error) return [];
  return (data ?? []) as AnswerRow[];
}

/** 新ラウンド開始時にそのルームの回答を削除する（ホストのゲーム開始時） */
export async function deleteAnswersByRoom(
  roomId: string
): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("answers")
    .delete()
    .eq("room_id", roomId);
  if (error) return { error: error.message };
  return {};
}
