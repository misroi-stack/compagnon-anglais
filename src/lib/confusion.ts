import { supabase } from "@/lib/supabase";

interface WrongAnswerRow {
  word_id: string;
  selected_answer: string | null;
}

/**
 * Pour chaque mot, les réponses que l'enfant a choisies à tort par le passé en
 * Quiz, la plus fréquente en premier — sert à proposer ces distracteurs-là en
 * priorité plutôt qu'un tirage purement aléatoire (IDEAS.md priorité 4, point 6).
 * Un même mot peut accumuler des chaînes FR et EN selon le type de question qui
 * a produit l'erreur ; ça reste correct car buildQuestion() ne les compare
 * qu'au pool de distracteurs du même type (FR contre FR, EN contre EN).
 */
export async function getConfusionMap(profileId: string): Promise<Map<string, string[]>> {
  const { data, error } = await supabase
    .from("attempts")
    .select("word_id, selected_answer")
    .eq("profile_id", profileId)
    .eq("mode", "quiz")
    .eq("correct", false)
    .not("selected_answer", "is", null);

  if (error) throw error;

  return buildConfusionMap(data as WrongAnswerRow[]);
}

function buildConfusionMap(rows: WrongAnswerRow[]): Map<string, string[]> {
  const counts = new Map<string, Map<string, number>>();

  for (const row of rows) {
    if (!row.selected_answer) continue;
    const perWord = counts.get(row.word_id) ?? new Map<string, number>();
    perWord.set(row.selected_answer, (perWord.get(row.selected_answer) ?? 0) + 1);
    counts.set(row.word_id, perWord);
  }

  const result = new Map<string, string[]>();
  for (const [wordId, freq] of counts) {
    result.set(
      wordId,
      [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([value]) => value)
    );
  }
  return result;
}
