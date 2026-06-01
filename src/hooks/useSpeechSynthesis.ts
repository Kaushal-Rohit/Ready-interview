"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const onEndCallbackRef = useRef<(() => void) | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const voicesLoadedRef = useRef(false);

  // Load voices once available
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0 && !voicesLoadedRef.current) {
        voicesLoadedRef.current = true;
        // Prefer a clear English voice
        const preferred = voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.includes("Google") ||
              v.name.includes("Microsoft") ||
              v.name.includes("Samantha") ||
              v.name.includes("Daniel"))
        );
        voiceRef.current = preferred || voices.find((v) => v.lang.startsWith("en")) || voices[0];
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!text.trim()) {
      onEnd?.();
      return;
    }

    // CRITICAL: Clear the speech queue before every new utterance
    // This prevents audio compounding / rapid-fire playback
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
    }

    onEndCallbackRef.current = onEnd || null;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
      onEndCallbackRef.current?.();
      onEndCallbackRef.current = null;
    };

    utterance.onerror = (event) => {
      // "interrupted" is expected when we cancel() before a new speak()
      if (event.error !== "interrupted") {
        console.warn("SpeechSynthesis error:", event.error);
      }
      setIsSpeaking(false);
      utteranceRef.current = null;
      onEndCallbackRef.current?.();
      onEndCallbackRef.current = null;
    };

    utteranceRef.current = utterance;

    // Chrome workaround: speechSynthesis can pause internally after ~15s.
    // Keeping a periodic resume nudge prevents the audio from freezing.
    const resumeInterval = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } else {
        clearInterval(resumeInterval);
      }
    }, 10000);

    utterance.addEventListener("end", () => clearInterval(resumeInterval), { once: true });
    utterance.addEventListener("error", () => clearInterval(resumeInterval), { once: true });

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    utteranceRef.current = null;
    onEndCallbackRef.current = null;
  }, []);

  return { speak, stop, isSpeaking };
}
