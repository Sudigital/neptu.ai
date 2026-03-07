import { useState, useEffect, useRef } from "react";

const CHAR_DELAY_MS = 18;
const FAST_CHAR_DELAY_MS = 8;

/**
 * Typing effect — reveals text character by character for a terminal-style feel.
 * Returns the currently visible portion of the text.
 */
export function useTypingEffect(fullText: string, active: boolean): string {
  const [displayed, setDisplayed] = useState("");
  const prevTextRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active || !fullText) {
      setDisplayed(fullText);
      prevTextRef.current = fullText;
      return;
    }

    // If the text changed (new response), start typing from scratch
    if (fullText !== prevTextRef.current) {
      prevTextRef.current = fullText;
      setDisplayed("");
      let index = 0;

      const tick = () => {
        index++;
        setDisplayed(fullText.slice(0, index));
        if (index < fullText.length) {
          // Speed up for spaces/punctuation
          const char = fullText[index];
          const delay =
            char === " " || char === "\n" ? FAST_CHAR_DELAY_MS : CHAR_DELAY_MS;
          timerRef.current = setTimeout(tick, delay);
        }
      };

      timerRef.current = setTimeout(tick, CHAR_DELAY_MS);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [fullText, active]);

  return displayed;
}
