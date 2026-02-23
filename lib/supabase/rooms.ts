import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const SHORT_CODE_LENGTH = 10;
const SHORT_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 0,O,1,I を除く

function generateShortCode(): string {
  let code = "";
  for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
    code += SHORT_CODE_CHARS[Math.floor(Math.random() * SHORT_CODE_CHARS.length)];
  }
  return code;
}

export interface RoomRow {
  id: string;
  short_code: string | null;
  status: string;
  current_question: string;
  /** 使用済みお題のID（questions.json の id） */
  used_question_indices: string[];
}

export interface PlayerRow {
  id: string;
  room_id: string;
  name: string;
  is_host: boolean;
}

export async function createRoom(playerName: string): Promise<
  | { roomId: string; playerId: string; shortCode: string }
  | { error: string }
> {
  const supabase = createClient();
  const maxRetries = 5;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const shortCode = generateShortCode();
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .insert({
        short_code: shortCode,
        status: "lobby",
        current_question: "",
        used_question_indices: [],
      })
      .select("id")
      .single();

    if (roomError) {
      if (roomError.code === "23505") continue; // unique violation → retry
      return { error: roomError.message ?? "ルーム作成に失敗しました" };
    }
    if (!room?.id) return { error: "ルーム作成に失敗しました" };

    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert({
        room_id: room.id,
        name: playerName,
        is_host: true,
      })
      .select("id")
      .single();

    if (playerError || !player?.id) {
      return { error: playerError?.message ?? "プレイヤー登録に失敗しました" };
    }

    return { roomId: room.id, playerId: player.id, shortCode };
  }

  return { error: "ルーム作成に失敗しました（ショートコードの重複）" };
}

export async function getRoom(roomId: string): Promise<RoomRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, short_code, status, current_question, used_question_indices")
    .eq("id", roomId)
    .single();

  if (error || !data) return null;
  const raw = data.used_question_indices;
  const used_question_indices = Array.isArray(raw)
    ? raw.filter((x): x is string => typeof x === "string")
    : [];
  return { ...data, used_question_indices } as RoomRow;
}

export async function getRoomByShortCode(shortCode: string): Promise<RoomRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, short_code, status, current_question, used_question_indices")
    .eq("short_code", shortCode.toUpperCase())
    .single();

  if (error || !data) return null;
  const raw = data.used_question_indices;
  const used_question_indices = Array.isArray(raw)
    ? raw.filter((x): x is string => typeof x === "string")
    : [];
  return { ...data, used_question_indices } as RoomRow;
}

/** ショートコードまたはUUIDでルームを取得（参加・ルームページ用） */
export async function resolveRoom(idOrShortCode: string): Promise<RoomRow | null> {
  const trimmed = idOrShortCode.trim();
  if (trimmed.length === 36 && trimmed.includes("-")) {
    return getRoom(trimmed);
  }
  return getRoomByShortCode(trimmed);
}

export async function joinRoom(
  code: string,
  playerName: string
): Promise<
  | { roomId: string; playerId: string; shortCode: string }
  | { error: string }
> {
  const supabase = createClient();

  const room = await resolveRoom(code);
  if (!room) {
    return { error: "ルームが見つかりません" };
  }

  const { data: player, error } = await supabase
    .from("players")
    .insert({
      room_id: room.id,
      name: playerName,
      is_host: false,
    })
    .select("id")
    .single();

  if (error || !player?.id) {
    return { error: error?.message ?? "参加に失敗しました" };
  }

  const shortCode = room.short_code ?? room.id;
  return { roomId: room.id, playerId: player.id, shortCode };
}

export async function getPlayersByRoom(
  roomId: string
): Promise<PlayerRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("players")
    .select("id, room_id, name, is_host")
    .eq("room_id", roomId)
    .order("is_host", { ascending: false });

  if (error) return [];
  return (data ?? []) as PlayerRow[];
}

export type RoomPhase = "lobby" | "question" | "exposure" | "closeup" | "result";

export async function updateRoomStatus(
  roomId: string,
  status: RoomPhase,
  current_question?: string,
  used_question_indices?: string[]
): Promise<{ error?: string }> {
  const supabase = createClient();
  const payload: {
    status: string;
    current_question?: string;
    used_question_indices?: string[];
  } = { status };
  if (current_question !== undefined) {
    payload.current_question = current_question;
  }
  if (used_question_indices !== undefined) {
    payload.used_question_indices = used_question_indices;
  }
  const { error } = await supabase
    .from("rooms")
    .update(payload)
    .eq("id", roomId);
  if (error) return { error: error.message };
  return {};
}

/**
 * ルームから退室する。
 * ホストが抜けた場合は残り1人を新ホストに。誰も残らなければルームを削除する。
 * supabaseInstance を渡すとそれを使う（API Route からサーバー用クライアントを渡す想定）。
 */
export async function leaveRoom(
  roomId: string,
  playerId: string,
  supabaseInstance?: SupabaseClient
): Promise<{ error?: string }> {
  const supabase = supabaseInstance ?? createClient();

  const { data: leavingPlayer, error: fetchError } = await supabase
    .from("players")
    .select("id, room_id, is_host")
    .eq("id", playerId)
    .single();

  if (fetchError || !leavingPlayer || leavingPlayer.room_id !== roomId) {
    return { error: "プレイヤーが見つかりません" };
  }

  const wasHost = leavingPlayer.is_host;
  const allPlayers = await getPlayersByRoom(roomId);
  const remaining = allPlayers.filter((p) => p.id !== playerId);

  if (remaining.length === 0) {
    const { error: deleteError } = await supabase
      .from("players")
      .delete()
      .eq("id", playerId)
      .eq("room_id", roomId);
    if (deleteError) return { error: deleteError.message };
    const { error: roomDeleteError } = await supabase
      .from("rooms")
      .delete()
      .eq("id", roomId);
    if (roomDeleteError) return { error: roomDeleteError.message };
    return {};
  }

  // ホストが抜ける場合: 退室者の is_host を外し、新ホストを立てる。いずれ失敗しても退室（DELETE）は必ず行う。
  if (wasHost) {
    await supabase
      .from("players")
      .update({ is_host: false })
      .eq("id", playerId);
    const newHost = remaining[0];
    await supabase
      .from("players")
      .update({ is_host: true })
      .eq("id", newHost.id);
  }

  const { error: deleteError } = await supabase
    .from("players")
    .delete()
    .eq("id", playerId)
    .eq("room_id", roomId);
  if (deleteError) return { error: deleteError.message };

  return {};
}
