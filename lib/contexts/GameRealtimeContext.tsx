"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useGameRealtime } from "@/hooks/useGameRealtime";

type GameRealtimeValue = {
  sendReaction: (emoji: string) => void;
  isSubscribed: boolean;
};

const defaultValue: GameRealtimeValue = {
  sendReaction: () => {},
  isSubscribed: false,
};

const GameRealtimeContext = createContext<GameRealtimeValue>(defaultValue);

export function GameRealtimeProvider({
  roomId,
  children,
}: {
  roomId: string | null;
  children: ReactNode;
}) {
  const { sendReaction, isSubscribed } = useGameRealtime(roomId);
  return (
    <GameRealtimeContext.Provider value={{ sendReaction, isSubscribed }}>
      {children}
    </GameRealtimeContext.Provider>
  );
}

export function useGameRealtimeContext(): GameRealtimeValue {
  return useContext(GameRealtimeContext);
}
