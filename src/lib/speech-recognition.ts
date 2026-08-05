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
