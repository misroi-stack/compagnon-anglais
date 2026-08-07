import { supabase } from "@/lib/supabase";
import { applyAttempt, createInitialProgress } from "@/lib/leitner";
import { saveWordProgress } from "@/lib/progress";
import type { Attempt, WordProgress } from "@/types/progress";

export async function recordAttempt(
  attempt: Attempt,
  currentProgress: WordProgress | undefined
): Promise<WordProgress> {
  const { error } = await supabase.from("attempts").insert({
    profile_id: attempt.profileId,
    word_id: attempt.wordId,
    theme_id: attempt.themeId,
    mode: attempt.mode,
    correct: attempt.correct,
    response_time_ms: attempt.responseTimeMs,
    selected_answer: attempt.selectedAnswer ?? null,
  });
  if (error) throw error;

  const base = currentProgress ?? createInitialProgress(attempt.wordId);
  const updated = applyAttempt(base, attempt);
  await saveWordProgress(attempt.profileId, updated);
  return updated;
}
