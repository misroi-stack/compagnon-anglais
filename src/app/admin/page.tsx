"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import {
  isCurrentUserAdmin,
  listParents,
  listInviteCodes,
  createInviteCode,
  setInviteCodeActive,
  listDeactivatedProfiles,
  reactivateProfile,
  type AdminParent,
  type InviteCode,
  type DeactivatedProfile,
} from "@/lib/admin";

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [parents, setParents] = useState<AdminParent[]>([]);
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [deactivated, setDeactivated] = useState<DeactivatedProfile[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newCode, setNewCode] = useState("");
  const [creatingCode, setCreatingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => {
    isCurrentUserAdmin()
      .then(setAllowed)
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;

    async function load() {
      const [p, c, d] = await Promise.all([listParents(), listInviteCodes(), listDeactivatedProfiles()]);
      if (!cancelled) {
        setParents(p);
        setCodes(c);
        setDeactivated(d);
        setLoadingData(false);
      }
    }

    load().catch(() => {
      if (!cancelled) setError("Impossible de charger les données admin — vérifie ta connexion.");
    });
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  async function handleToggleCode(code: string, active: boolean) {
    setCodes((prev) => prev.map((c) => (c.code === code ? { ...c, active: !active } : c)));
    try {
      await setInviteCodeActive(code, !active);
    } catch {
      setCodes((prev) => prev.map((c) => (c.code === code ? { ...c, active } : c)));
    }
  }

  async function handleCreateCode(e: React.FormEvent) {
    e.preventDefault();
    if (!newCode.trim()) return;
    setCreatingCode(true);
    setCodeError(null);
    try {
      await createInviteCode(newCode);
      setNewCode("");
      setCodes(await listInviteCodes());
    } catch {
      setCodeError("Impossible de créer ce code (existe peut-être déjà).");
    } finally {
      setCreatingCode(false);
    }
  }

  async function handleReactivate(profileId: string) {
    setDeactivated((prev) => prev.filter((p) => p.id !== profileId));
    await reactivateProfile(profileId);
  }

  if (checking) {
    return <LoadingIndicator fullScreen />;
  }

  if (!allowed) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-violet-100 via-fuchsia-50 to-amber-50 px-6">
        <p className="text-xl font-bold text-rose-500">Accès refusé</p>
        <button type="button" onClick={() => router.push("/")} className="text-sm text-violet-400 underline">
          ← Retour à l&apos;app
        </button>
      </main>
    );
  }

  if (error) {
    return <LoadingIndicator fullScreen error={error} />;
  }

  if (loadingData) {
    return <LoadingIndicator fullScreen />;
  }

  const parentById = new Map(parents.map((p) => [p.id, p]));

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-gradient-to-b from-violet-100 via-fuchsia-50 to-amber-50 px-6 py-10">
      <h1 className="text-3xl font-extrabold text-violet-700">🛠️ Portail admin</h1>

      <section className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 font-bold text-violet-700">Codes d&apos;invitation</h2>
        <div className="flex flex-col gap-2">
          {codes.map((c) => (
            <div key={c.code} className="flex items-center justify-between rounded-xl bg-violet-50 px-4 py-2">
              <span className="font-mono font-semibold text-violet-700">{c.code}</span>
              <button
                type="button"
                onClick={() => handleToggleCode(c.code, c.active)}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  c.active ? "bg-emerald-400 text-white" : "bg-rose-200 text-rose-700"
                }`}
              >
                {c.active ? "Actif" : "Inactif"}
              </button>
            </div>
          ))}
        </div>

        {codeError && <p className="mt-3 text-sm text-rose-500">{codeError}</p>}

        <form onSubmit={handleCreateCode} className="mt-4 flex gap-2">
          <input
            type="text"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="Nouveau code"
            className="flex-1 rounded-xl border-2 border-violet-200 px-4 py-2 uppercase text-violet-900 outline-none focus:border-violet-400"
          />
          <button
            type="submit"
            disabled={creatingCode || !newCode.trim()}
            className="rounded-xl bg-violet-600 px-4 py-2 font-bold text-white disabled:opacity-40"
          >
            Ajouter
          </button>
        </form>
      </section>

      <section className="w-full max-w-3xl overflow-x-auto rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 font-bold text-violet-700">Comptes parents ({parents.length})</h2>
        <div className="flex flex-col gap-2">
          {parents.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-violet-50 px-4 py-2 text-sm"
            >
              <span className="font-semibold text-violet-700">
                {p.email}
                {p.isAdmin && <span className="ml-1 text-xs font-normal text-amber-500">(admin)</span>}
              </span>
              <span className="text-violet-400">Code : {p.signupCode}</span>
              <span className="text-violet-400">
                {p.profileCount} profil{p.profileCount > 1 ? "s" : ""}
              </span>
              <span className="text-violet-400">
                Dernière connexion :{" "}
                {p.lastSignInAt ? new Date(p.lastSignInAt).toLocaleDateString("fr-FR") : "jamais"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 font-bold text-violet-700">Profils désactivés ({deactivated.length})</h2>
        {deactivated.length === 0 ? (
          <p className="text-sm text-violet-400">Aucun profil désactivé.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {deactivated.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-xl bg-violet-50 px-4 py-2 text-sm"
              >
                <span className="font-semibold text-violet-700">
                  {d.name}{" "}
                  <span className="text-xs font-normal text-violet-400">
                    ({parentById.get(d.parentId)?.email ?? "parent inconnu"})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => handleReactivate(d.id)}
                  className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700"
                >
                  Réactiver
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <button type="button" onClick={() => router.push("/")} className="text-sm text-violet-400 underline">
        ← Retour à l&apos;app
      </button>
    </main>
  );
}
