"use client";

import { useEffect, useRef } from "react";

export default function AmbientPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.volume = 0.12;

    const startAudio = async () => {
      try {
        await audio.play();
      } catch (err) {
        console.log("Autoplay blocked");
      }
    };

    // first interaction unlock
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
