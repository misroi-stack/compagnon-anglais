export type RecognitionOutcome =
  | { status: "result"; transcript: string }
  | { status: "no-speech" }
  | { status: "not-allowed" }
  | { status: "unsupported" }
  | { status: "error" };

function getSpeechRecognitionCtor(): typeof window.SpeechRecognition | undefined {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

export function isSpeechRecognitionSupported(): boolean {
  return !!getSpeechRecognitionCtor();
}

export function listenOnce(lang = "en-US"): Promise<RecognitionOutcome> {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) return Promise.resolve({ status: "unsupported" });

  return new Promise((resolve) => {
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.maxAlternatives = 1;
    recognition.interimResults = false;

    let settled = false;
    function settle(outcome: RecognitionOutcome) {
      if (settled) return;
      settled = true;
      resolve(outcome);
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      settle({ status: "result", transcript });
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech") settle({ status: "no-speech" });
      else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        settle({ status: "not-allowed" });
      } else settle({ status: "error" });
    };

    recognition.onend = () => settle({ status: "no-speech" });

    recognition.start();
  });
}

export function normalizeForCompare(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "");
}

/** Compare ce qui a été entendu au mot cible, en acceptant que l'enfant l'ait
 *  répété 2 ou 3 fois d'affilée (ex: "dog dog") — ça arrive souvent quand la
 *  reconnaissance vocale ne capte rien au premier essai, et ça ne doit pas
 *  compter comme faux. */
export function matchesSpokenWord(transcript: string, target: string): boolean {
  const heardTokens = normalizeForCompare(transcript).split(/\s+/).filter(Boolean);
  const targetTokens = normalizeForCompare(target).split(/\s+/).filter(Boolean);
  if (targetTokens.length === 0 || heardTokens.length === 0) return false;
  if (heardTokens.length % targetTokens.length !== 0) return false;

  const repeats = heardTokens.length / targetTokens.length;
  if (repeats < 1 || repeats > 3) return false;

  for (let r = 0; r < repeats; r++) {
    for (let i = 0; i < targetTokens.length; i++) {
      if (heardTokens[r * targetTokens.length + i] !== targetTokens[i]) return false;
    }
  }
  return true;
}
