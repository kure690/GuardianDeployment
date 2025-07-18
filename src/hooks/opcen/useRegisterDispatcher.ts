import { useEffect } from 'react';

export function useRegisterDispatcher(globalSocket?: any, userId?: string) {
  const registerOpCen = (opCenId: string) => {
    if (globalSocket && opCenId) {
      globalSocket.emit('registerOpCen', { opCenId });
    }
  };

  useEffect(() => {
    if (globalSocket && userId) {
      globalSocket.emit('registerDispatcher', { dispatcherId: userId });
    }
  }, [globalSocket, userId]);

  return { registerOpCen };
} 