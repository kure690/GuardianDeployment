const audioCache = new Map<string, () => Promise<void>>();

export async function playRingSound(url: string) {
  let doPlay = audioCache.get(url);

  if (!doPlay) {
    const canPlayPromise = new Promise<HTMLAudioElement>((resolve) => {
      const audio = new Audio(url);
      audio.addEventListener("canplaythrough", () => resolve(audio), {
        once: true,
      });
    });

    doPlay = async () => {
      const audio = await canPlayPromise;
      try {
        await audio.play();
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    };

    audioCache.set(url, doPlay);
  }

  await doPlay();
} 