"use client";

import { useEffect, useRef } from "react";

export default function AmbientPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.volume = 0.12;

    const tryPlay = async () => {
      try {
        if (audio.paused) {
          await audio.play();
        }
      } catch (err) {
        console.log("Autoplay blocked");
      }
    };

    // autoplay attempt
    tryPlay();

    // fallback unlock on first interaction
    const unlock = () => {
      tryPlay();
      window.removeEventListener("click", unlock);
    };

    window.addEventListener("click", unlock);

    return () => {
      window.removeEventListener("click", unlock);
    };
  }, []);

  return (
    <audio
      ref={audioRef}
      src="/audio/bella-ciao.mp3"
      loop
      autoPlay
      preload="auto"
    />
  );
}
