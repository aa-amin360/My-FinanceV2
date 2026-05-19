"use client";

import { useEffect, useRef } from "react";

export default function AmbientPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.volume = 0.12;

    const startAudio = async () => {
      if (startedRef.current) return;

      try {
        await audio.play();
        startedRef.current = true;
      } catch (err) {
        console.log("Autoplay blocked");
      }
    };

    // try autoplay immediately
    startAudio();

    // fallback: first interaction only
    window.addEventListener("click", startAudio, { once: true });

    return () => {
      window.removeEventListener("click", startAudio);
    };
  }, []);

  return (
    <audio
      ref={audioRef}
      loop
      preload="auto"
    >
      <source src="/audio/bella-ciao.mp3" type="audio/mpeg" />
    </audio>
  );
}
