import { create } from "zustand";

// --- Types (schema-aligned) ---
export type RoomPhase = "lobby" | "question" | "exposure" | "closeup" | "result";

export interface Player {
  id: string;
  room_id: string;
  name: string;
  is_host: boolean;
}

export interface Answer {
  id: string;
  room_id: string;
  player_id: string;
  content: string;
}

export interface IncomingReaction {
  id: string;
  emoji: string;
  x: number;
}

const REACTION_TTL_MS = 1800;

export interface Vote {
  id: string;
  room_id: string;
  player_id: string;
  answer_id: string;
}

// --- State ---
interface GameState {
  roomId: string | null;
  /** 参加コード（10桁）。表示・コピー用 */
  shortCode: string | null;
  myPlayerId: string | null;
  phase: RoomPhase;
  currentQuestion: string;
  players: Player[];
  answers: Answer[];
  votes: Vote[];
  incomingReactions: IncomingReaction[];
}

// --- Actions ---
interface GameActions {
  setRoomStatus: (status: RoomPhase, current_question?: string) => void;
  setRoom: (roomId: string | null, myPlayerId?: string) => void;
  setShortCode: (shortCode: string | null) => void;
  setPlayers: (players: Player[]) => void;
  setAnswers: (answers: Answer[]) => void;
  setVotes: (votes: Vote[]) => void;
  addIncomingReaction: (emoji: string, x?: number) => void;
  removeIncomingReaction: (id: string) => void;
  resetGame: () => void;
}

const initialState: GameState = {
  roomId: null,
  shortCode: null,
  myPlayerId: null,
  phase: "lobby",
  currentQuestion: "",
  players: [],
  answers: [],
  votes: [],
  incomingReactions: [],
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  setRoomStatus: (status, current_question) =>
    set((state) => ({
      phase: status,
      ...(current_question !== undefined && { currentQuestion: current_question }),
    })),

  setRoom: (roomId, myPlayerId) =>
    set({
      roomId,
      ...(myPlayerId !== undefined && { myPlayerId }),
      ...(roomId === null && { shortCode: null }),
    }),

  setShortCode: (shortCode) => set({ shortCode }),

  setPlayers: (players) => set({ players }),

  setAnswers: (answers) => set({ answers }),

  setVotes: (votes) => set({ votes }),

  addIncomingReaction: (emoji, x) => {
    const id = `${Date.now()}-${Math.random()}`;
    const positionX = x ?? Math.random() * 80 + 10;
    set((state) => ({
      incomingReactions: [
        ...state.incomingReactions,
        { id, emoji, x: positionX },
      ],
    }));
    setTimeout(() => {
      get().removeIncomingReaction(id);
    }, REACTION_TTL_MS);
  },

  removeIncomingReaction: (id) =>
    set((state) => ({
      incomingReactions: state.incomingReactions.filter((r) => r.id !== id),
    })),

  resetGame: () => set(initialState),
}));
