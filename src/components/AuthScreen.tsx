"use client";

import { useState } from "react";
import { signIn, signUp } from "@/lib/auth";

type Mode = "login" | "signup";

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password, code.trim().toUpperCase());
      }
    } catch (err) {
      if (err instanceof Error && err.message === "email_confirmation_required") {
        setInfo("Compte créé — vérifie ta boîte mail pour confirmer avant de te connecter.");
      } else {
        setError(mapAuthError(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  function toggleMode() {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setError(null);
    setInfo(null);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-violet-100 via-fuchsia-50 to-amber-50 px-6 py-12">
      <h1 className="text-center text-4xl font-extrabold text-violet-700 sm:text-5xl">
        🌟 Compagnon Anglais 🌟
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-3xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-center text-xl font-bold text-violet-700">
          {mode === "login" ? "Connexion parent" : "Créer un compte parent"}
        </h2>

        {error && (
          <p className="rounded-full bg-rose-100 px-4 py-2 text-center text-sm text-rose-600">{error}</p>
        )}
        {info && (
          <p className="rounded-full bg-emerald-100 px-4 py-2 text-center text-sm text-emerald-700">{info}</p>
        )}

        <label className="flex flex-col gap-1 text-sm font-semibold text-violet-600">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border-2 border-violet-200 px-4 py-2 text-base font-normal text-violet-900 outline-none focus:border-violet-400"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold text-violet-600">
          Mot de passe
          <input
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border-2 border-violet-200 px-4 py-2 text-base font-normal text-violet-900 outline-none focus:border-violet-400"
          />
        </label>

        {mode === "signup" && (
          <label className="flex flex-col gap-1 text-sm font-semibold text-violet-600">
            Code d&apos;invitation
            <input
              type="text"
              autoComplete="off"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex: BONJOUR"
              className="rounded-xl border-2 border-violet-200 px-4 py-2 text-base font-normal uppercase text-violet-900 outline-none focus:border-violet-400"
            />
          </label>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-xl bg-violet-600 py-3 font-bold text-white disabled:opacity-40"
        >
          {submitting ? "…" : mode === "login" ? "Se connecter" : "Créer le compte"}
        </button>

        <button type="button" onClick={toggleMode} className="text-center text-sm text-violet-400 underline">
          {mode === "login" ? "Pas encore de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
        </button>
      </form>
    </main>
  );
}

function mapAuthError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  if (message.includes("invalid_code") || message.includes("invalid_or_inactive_code")) {
    return "Code d'invitation invalide.";
  }
  if (message.includes("Invalid login credentials")) {
    return "Email ou mot de passe incorrect.";
  }
  if (message.includes("already registered")) {
    return "Un compte existe déjà avec cet email.";
  }
  if (message.includes("Password should be at least")) {
    return "Le mot de passe doit contenir au moins 6 caractères.";
  }
  return "Une erreur est survenue, réessaie.";
}
