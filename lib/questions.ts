const QUESTIONS_URL = "/answer/questions.json";

export interface QuestionItem {
  id: string;
  text: string;
}

interface QuestionsJson {
  questions: { id: string; text: string }[];
}

/** 1ファイルの questions.json を取得。形式は { questions: [{ id, text }, ...] } */
async function fetchQuestions(): Promise<QuestionItem[]> {
  const res = await fetch(QUESTIONS_URL);
  if (!res.ok) return [];
  const data: unknown = await res.json();
  if (!data || typeof data !== "object" || !("questions" in data)) return [];
  const q = (data as QuestionsJson).questions;
  if (!Array.isArray(q)) return [];
  return q.filter(
    (item): item is QuestionItem =>
      item != null &&
      typeof item === "object" &&
      typeof (item as QuestionItem).id === "string" &&
      typeof (item as QuestionItem).text === "string"
  );
}

/**
 * 使用済みIDを除いてランダムに1つ選ぶ。未使用がなければ null。
 * usedIds は Set または配列で渡せる（Set の方が O(1) で高速）。
 */
export async function pickRandomQuestion(
  usedIds: string[] | Set<string>
): Promise<QuestionItem | null> {
  const all = await fetchQuestions();
  const usedSet = usedIds instanceof Set ? usedIds : new Set(usedIds);
  const unused = all.filter((item) => !usedSet.has(item.id));
  if (unused.length === 0) return null;
  const picked = unused[Math.floor(Math.random() * unused.length)];
  return { id: picked.id, text: picked.text };
}

/**
 * ゲーム開始用：全お題からランダムに1つ選ぶ。
 */
export async function pickFirstQuestion(): Promise<QuestionItem | null> {
  return pickRandomQuestion([]);
}
