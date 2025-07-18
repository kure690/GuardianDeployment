import { useEffect, useRef } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { CallingState } from '@stream-io/video-client';

import generalRingSound from '../../assets/sounds/general.mp3';

export function useRingSound(soundUrl = generalRingSound) {
  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  
  useEffect(() => {
    console.log("Call state changed to:", callingState);
  }, [callingState]);

  useEffect(() => {
    if (callingState === CallingState.RINGING) {
      console.log("Starting ring sound");
      
      const audio = new Audio(soundUrl);
      audio.loop = true;
      audioRef.current = audio;

      audio.play().catch(error => {
        console.error("Error playing ring sound:", error);
      });
    } else {
      if (audioRef.current) {
        console.log("Stopping ring sound");
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    }

    return () => {
      if (audioRef.current) {
        console.log("Cleaning up ring sound");
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, [callingState, soundUrl]);
} 