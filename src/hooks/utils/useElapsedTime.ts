import { useState, useEffect } from 'react';

export function useElapsedTime(acceptedAt: string | null) {
  const [lapsTime, setLapsTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (acceptedAt) {
        const now = new Date();
        const acceptedTime = new Date(acceptedAt);
        const elapsedSeconds = Math.floor((now.getTime() - acceptedTime.getTime()) / 1000);
        setLapsTime(elapsedSeconds);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [acceptedAt]);

  const formatLapsTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds} sec`;
  };

  return { lapsTime, formatLapsTime };
} 