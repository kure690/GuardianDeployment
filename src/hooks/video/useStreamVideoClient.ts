import { useState, useEffect } from 'react';
import { StreamVideoClient } from '@stream-io/video-react-sdk';
import config from '../../config';

export function useStreamVideoClient(userId: string, userName: string, token: string | null, avatarImg: string) {
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);

  useEffect(() => {
    if (!videoClient && userId && token) {
      try {
        const client = StreamVideoClient.getOrCreateInstance({
          apiKey: config.STREAM_APIKEY,
          user: {
            id: userId,
            name: userName,
            image: avatarImg,
          },
          token: token,
          options: {
            logLevel: 'info',
          },
        });
        client.on('all', (event: any) => {
          if (event.type?.includes('call')) {
          }
        });
        client.on('connection.changed', (event: any) => {
        });
        setVideoClient(client);
      } catch (error) {
      }
    }
  }, [userId, token, avatarImg]);

  return videoClient;
} 