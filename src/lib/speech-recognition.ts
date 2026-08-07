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

/** Vrai si la séquence de `targetTokens` apparaît telle quelle, à la suite, n'importe où dans `heardTokens`. */
function containsWordSequence(heardTokens: string[], targetTokens: string[]): boolean {
  for (let start = 0; start <= heardTokens.length - targetTokens.length; start++) {
    let matches = true;
    for (let i = 0; i < targetTokens.length; i++) {
      if (heardTokens[start + i] !== targetTokens[i]) {
        matches = false;
        break;
      }
    }
    if (matches) return true;
  }
  return false;
}

/** Compare ce qui a été entendu au mot cible : correct dès que le mot cible est
 *  présent tel quel dans ce qui a été dit, même entouré d'autres mots (ex.
 *  l'enfant hésite à voix haute, "euh… non… dog") — l'important est qu'il ait
 *  fini par prononcer le bon mot, pas que ce soit la seule chose entendue. Ça
 *  couvre aussi le cas où l'enfant le répète plusieurs fois d'affilée. */
export function matchesSpokenWord(transcript: string, target: string): boolean {
  const heardTokens = normalizeForCompare(transcript).split(/\s+/).filter(Boolean);
  const targetTokens = normalizeForCompare(target).split(/\s+/).filter(Boolean);
  if (targetTokens.length === 0 || heardTokens.length === 0) return false;
  return containsWordSequence(heardTokens, targetTokens);
}
