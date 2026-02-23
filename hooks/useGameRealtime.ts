"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  useGameStore,
  type RoomPhase,
} from "@/lib/store/gameStore";
import { getPlayersByRoom, updateRoomStatus } from "@/lib/supabase/rooms";
import { getAnswersByRoom } from "@/lib/supabase/answers";
import { getVotesByRoom } from "@/lib/supabase/votes";

export function useGameRealtime(roomId: string | null): {
  isSubscribed: boolean;
  sendReaction: (emoji: string) => void;
} {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const setRoomStatus = useGameStore((s) => s.setRoomStatus);
  const addIncomingReaction = useGameStore((s) => s.addIncomingReaction);
  const setPlayers = useGameStore((s) => s.setPlayers);
  const setVotes = useGameStore((s) => s.setVotes);

  const sendReaction = useCallback(
    (emoji: string) => {
      const ch = channelRef.current;
      if (!ch || !isSubscribed) return;
      ch.send({
        type: "broadcast",
        event: "reaction",
        payload: { emoji },
      });
    },
    [isSubscribed]
  );

  useEffect(() => {
    if (!roomId) {
      setIsSubscribed(false);
      channelRef.current = null;
      return;
    }

    const supabase = createClient();
    const channelName = `room:${roomId}`;
    const channel = supabase.channel(channelName);

    const refetchPlayers = () => {
      getPlayersByRoom(roomId).then((list) => {
        setPlayers(
          list.map((p) => ({
            id: p.id,
            room_id: p.room_id,
            name: p.name,
            is_host: p.is_host,
          }))
        );
      });
    };

    channel
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          const row = payload.new as { status?: string; current_question?: string };
          if (row.status) {
            setRoomStatus(row.status as RoomPhase, row.current_question);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        refetchPlayers
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        refetchPlayers
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "players",
        },
        () => {
          refetchPlayers();
          setTimeout(refetchPlayers, 400);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "answers",
          filter: `room_id=eq.${roomId}`,
        },
        async () => {
          const state = useGameStore.getState();
          if (state.phase !== "question") return;
          const [answersList, playersList] = await Promise.all([
            getAnswersByRoom(roomId),
            getPlayersByRoom(roomId),
          ]);
          if (answersList.length !== playersList.length) return;
          const isHost = state.myPlayerId != null && playersList.some((p) => p.id === state.myPlayerId && p.is_host);
          if (!isHost) return;
          await updateRoomStatus(roomId, "exposure");
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
          filter: `room_id=eq.${roomId}`,
        },
        async () => {
          const [votesList, playersList] = await Promise.all([
            getVotesByRoom(roomId),
            getPlayersByRoom(roomId),
          ]);
          setVotes(
            votesList.map((v) => ({
              id: v.id,
              room_id: v.room_id,
              player_id: v.player_id,
              answer_id: v.answer_id,
            }))
          );
          const state = useGameStore.getState();
          if (state.phase !== "exposure") return;
          if (votesList.length !== playersList.length) return;
          const isHost = state.myPlayerId != null && playersList.some((p) => p.id === state.myPlayerId && p.is_host);
          if (!isHost) return;
          await updateRoomStatus(roomId, "closeup");
        }
      )
      .on("broadcast", { event: "reaction" }, (payload) => {
        const { emoji, x } = payload.payload as { emoji: string; x?: number };
        if (emoji) addIncomingReaction(emoji, x);
      })
      .subscribe((status) => {
        setIsSubscribed(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsSubscribed(false);
    };
  }, [roomId, setRoomStatus, setPlayers, setVotes, addIncomingReaction]);

  return { isSubscribed, sendReaction };
}
