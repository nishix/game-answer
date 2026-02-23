import { NextResponse } from "next/server";
import { leaveRoom } from "@/lib/supabase/rooms";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LeaveBody = { roomId?: unknown; playerId?: unknown } | null;

/** タブ閉じ・リロード時に sendBeacon で退室するための API */
export async function POST(request: Request) {
  try {
    let body: LeaveBody = null;
    try {
      body = (await request.json()) as LeaveBody;
    } catch {
      const text = await request.text();
      body = text ? (JSON.parse(text) as LeaveBody) : null;
    }
    const roomId = typeof body?.roomId === "string" ? body.roomId.trim() : null;
    const playerId = typeof body?.playerId === "string" ? body.playerId.trim() : null;
    if (!roomId || !playerId) {
      return NextResponse.json(
        { error: "roomId と playerId が必要です" },
        { status: 400 }
      );
    }
    const supabase = createServerClient();
    const result = await leaveRoom(roomId, playerId, supabase);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "退室処理に失敗しました" },
      { status: 500 }
    );
  }
}
