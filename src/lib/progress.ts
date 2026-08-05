import { supabase } from "@/lib/supabase";
import type { GameMode, WordProgress } from "@/types/progress";

interface WordProgressRow {
  word_id: string;
  box: number;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  success_modes: string[];
  mastered: boolean;
}

function fromRow(row: WordProgressRow): WordProgress {
  return {
    wordId: row.word_id,
    box: row.box as WordProgress["box"],
    lastReviewedAt: row.last_reviewed_at,
    nextReviewAt: row.next_review_at,
    successModes: row.success_modes as GameMode[],
    mastered: row.mastered,
  };
}

export async function getProgressForProfile(profileId: string): Promise<Map<string, WordProgress>> {
  const { data, error } = await supabase
    .from("word_progress")
    .select("word_id, box, last_reviewed_at, next_review_at, success_modes, mastered")
    .eq("profile_id", profileId);

  if (error) throw error;

  const map = new Map<string, WordProgress>();
  for (const row of data as WordProgressRow[]) {
    map.set(row.word_id, fromRow(row));
  }
  return map;
}

export async function saveWordProgress(profileId: string, progress: WordProgress): Promise<void> {
  const { error } = await supabase.from("word_progress").upsert(
    {
      profile_id: profileId,
      word_id: progress.wordId,
      box: progress.box,
      last_reviewed_at: progress.lastReviewedAt,
      next_review_at: progress.nextReviewAt,
      success_modes: progress.successModes,
      mastered: progress.mastered,
    },
    { onConflict: "profile_id,word_id" }
  );

  if (error) throw error;
}
