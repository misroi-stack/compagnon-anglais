import { supabase } from "@/lib/supabase";
import type { GameMode } from "@/types/progress";

export interface AttemptRecord {
  wordId: string;
  themeId: string;
  mode: GameMode;
  correct: boolean;
  responseTimeMs: number;
  createdAt: string;
}

interface AttemptRow {
  word_id: string;
  theme_id: string;
  mode: GameMode;
  correct: boolean;
  response_time_ms: number;
  created_at: string;
}

export async function getAttemptsForProfile(profileId: string): Promise<AttemptRecord[]> {
  const { data, error } = await supabase
    .from("attempts")
    .select("word_id, theme_id, mode, correct, response_time_ms, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data as AttemptRow[]).map((row) => ({
    wordId: row.word_id,
    themeId: row.theme_id,
    mode: row.mode,
    correct: row.correct,
    responseTimeMs: row.response_time_ms,
    createdAt: row.created_at,
  }));
}

/** Deux essais séparés de plus de 10 min sont considérés comme deux sessions distinctes. */
const SESSION_GAP_MS = 10 * 60 * 1000;
/** Durée plancher attribuée à une session, même avec un seul essai bref. */
const MIN_SESSION_MS = 15_000;

export interface Session {
  startMs: number;
  endMs: number;
  durationMs: number;
  attempts: number;
}

/**
 * L'app n'a pas de suivi explicite de session (début/fin) — on estime la durée
 * de pratique en regroupant les essais consécutifs d'un profil séparés de moins
 * de SESSION_GAP_MS. Ne couvre que les modes notés (Quiz/Associe/Répète) : les
 * Flashcards, en découverte libre sans essai enregistré, n'y contribuent pas.
 */
export function computeSessions(attempts: AttemptRecord[]): Session[] {
  if (attempts.length === 0) return [];

  const sessions: Session[] = [];
  let bucket: AttemptRecord[] = [attempts[0]];

  for (let i = 1; i < attempts.length; i++) {
    const prevMs = new Date(attempts[i - 1].createdAt).getTime();
    const curMs = new Date(attempts[i].createdAt).getTime();
    if (curMs - prevMs > SESSION_GAP_MS) {
      sessions.push(toSession(bucket));
      bucket = [];
    }
    bucket.push(attempts[i]);
  }
  sessions.push(toSession(bucket));
  return sessions;
}

function toSession(attempts: AttemptRecord[]): Session {
  const startMs = new Date(attempts[0].createdAt).getTime();
  const endMs = new Date(attempts[attempts.length - 1].createdAt).getTime();
  const lastResponseMs = attempts[attempts.length - 1].responseTimeMs;
  return {
    startMs,
    endMs,
    durationMs: Math.max(endMs - startMs, lastResponseMs, MIN_SESSION_MS),
    attempts: attempts.length,
  };
}

export interface OverallStats {
  totalAttempts: number;
  totalCorrect: number;
  accuracyPercent: number;
  todayMs: number;
  weekMs: number;
  monthMs: number;
  totalMs: number;
}

function startOfDay(msAgo: number): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime() - msAgo;
}

export function computeOverallStats(attempts: AttemptRecord[], sessions: Session[]): OverallStats {
  const totalCorrect = attempts.filter((a) => a.correct).length;
  const todayStart = startOfDay(0);
  const weekStart = startOfDay(6 * 24 * 60 * 60 * 1000);
  const monthStart = startOfDay(29 * 24 * 60 * 60 * 1000);

  let todayMs = 0;
  let weekMs = 0;
  let monthMs = 0;
  let totalMs = 0;

  for (const session of sessions) {
    totalMs += session.durationMs;
    if (session.startMs >= todayStart) todayMs += session.durationMs;
    if (session.startMs >= weekStart) weekMs += session.durationMs;
    if (session.startMs >= monthStart) monthMs += session.durationMs;
  }

  return {
    totalAttempts: attempts.length,
    totalCorrect,
    accuracyPercent: attempts.length ? Math.round((totalCorrect / attempts.length) * 100) : 0,
    todayMs,
    weekMs,
    monthMs,
    totalMs,
  };
}

export interface DayBucket {
  label: string;
  dateKey: string;
  minutes: number;
}

/** Minutes de pratique par jour, sur les `days` derniers jours (aujourd'hui inclus). */
export function dailyPracticeBuckets(sessions: Session[], days: number): DayBucket[] {
  const buckets: DayBucket[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = day.toISOString().slice(0, 10);
    const label = day.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
    buckets.push({ label, dateKey, minutes: 0 });
  }

  const byDate = new Map(buckets.map((b) => [b.dateKey, b]));
  for (const session of sessions) {
    const dateKey = new Date(session.startMs).toISOString().slice(0, 10);
    const bucket = byDate.get(dateKey);
    if (bucket) bucket.minutes += session.durationMs / 60_000;
  }

  return buckets.map((b) => ({ ...b, minutes: Math.round(b.minutes * 10) / 10 }));
}

export interface WeekBucket {
  label: string;
  attempts: number;
  correct: number;
  accuracyPercent: number | null;
}

/** Taux de réussite par semaine, sur les `weeks` dernières semaines (semaine en cours incluse). */
export function weeklyAccuracyBuckets(attempts: AttemptRecord[], weeks: number): WeekBucket[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dayOfWeek = (now.getDay() + 6) % 7; // lundi = 0
  const currentWeekStart = now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000;

  const buckets: WeekBucket[] = [];
  const starts: number[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = currentWeekStart - i * 7 * 24 * 60 * 60 * 1000;
    starts.push(start);
    const label = new Date(start).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    buckets.push({ label, attempts: 0, correct: 0, accuracyPercent: null });
  }

  for (const attempt of attempts) {
    const ms = new Date(attempt.createdAt).getTime();
    for (let i = starts.length - 1; i >= 0; i--) {
      if (ms >= starts[i]) {
        buckets[i].attempts += 1;
        if (attempt.correct) buckets[i].correct += 1;
        break;
      }
    }
  }

  return buckets.map((b) => ({
    ...b,
    accuracyPercent: b.attempts ? Math.round((b.correct / b.attempts) * 100) : null,
  }));
}

export interface ModeStats {
  mode: GameMode;
  attempts: number;
  correct: number;
  accuracyPercent: number;
  avgResponseMs: number;
}

export function modeBreakdown(attempts: AttemptRecord[]): ModeStats[] {
  const byMode = new Map<GameMode, AttemptRecord[]>();
  for (const attempt of attempts) {
    const list = byMode.get(attempt.mode) ?? [];
    list.push(attempt);
    byMode.set(attempt.mode, list);
  }

  return Array.from(byMode.entries()).map(([mode, list]) => {
    const correct = list.filter((a) => a.correct).length;
    const avgResponseMs = list.reduce((sum, a) => sum + a.responseTimeMs, 0) / list.length;
    return {
      mode,
      attempts: list.length,
      correct,
      accuracyPercent: Math.round((correct / list.length) * 100),
      avgResponseMs,
    };
  });
}

export interface ThemeAttemptStats {
  themeId: string;
  attempts: number;
  correct: number;
  accuracyPercent: number;
}

export function themeAttemptBreakdown(attempts: AttemptRecord[]): Map<string, ThemeAttemptStats> {
  const byTheme = new Map<string, AttemptRecord[]>();
  for (const attempt of attempts) {
    const list = byTheme.get(attempt.themeId) ?? [];
    list.push(attempt);
    byTheme.set(attempt.themeId, list);
  }

  const result = new Map<string, ThemeAttemptStats>();
  for (const [themeId, list] of byTheme) {
    const correct = list.filter((a) => a.correct).length;
    result.set(themeId, {
      themeId,
      attempts: list.length,
      correct,
      accuracyPercent: Math.round((correct / list.length) * 100),
    });
  }
  return result;
}

export interface WordStats {
  wordId: string;
  attempts: number;
  correct: number;
  incorrect: number;
  accuracyPercent: number;
}

const MIN_ATTEMPTS_FOR_RANKING = 2;

/** Mots avec le plus d'erreurs (au moins 2 essais), du moins réussi au plus réussi. */
export function strugglingWords(attempts: AttemptRecord[], limit: number): WordStats[] {
  return wordStatsList(attempts)
    .filter((w) => w.attempts >= MIN_ATTEMPTS_FOR_RANKING && w.accuracyPercent < 100)
    .sort((a, b) => a.accuracyPercent - b.accuracyPercent || b.incorrect - a.incorrect)
    .slice(0, limit);
}

/** Mots les mieux maîtrisés (au moins 2 essais, 100% de réussite), les plus pratiqués en premier. */
export function strongWords(attempts: AttemptRecord[], limit: number): WordStats[] {
  return wordStatsList(attempts)
    .filter((w) => w.attempts >= MIN_ATTEMPTS_FOR_RANKING && w.accuracyPercent === 100)
    .sort((a, b) => b.attempts - a.attempts)
    .slice(0, limit);
}

function wordStatsList(attempts: AttemptRecord[]): WordStats[] {
  const byWord = new Map<string, AttemptRecord[]>();
  for (const attempt of attempts) {
    const list = byWord.get(attempt.wordId) ?? [];
    list.push(attempt);
    byWord.set(attempt.wordId, list);
  }

  return Array.from(byWord.entries()).map(([wordId, list]) => {
    const correct = list.filter((a) => a.correct).length;
    return {
      wordId,
      attempts: list.length,
      correct,
      incorrect: list.length - correct,
      accuracyPercent: Math.round((correct / list.length) * 100),
    };
  });
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60_000);
  if (totalMinutes < 1) return "< 1 min";
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
}
