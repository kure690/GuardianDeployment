import { useState, useEffect } from 'react';
import { StreamChat } from 'stream-chat';
import config from '../../config';

export function useStreamChatClient(userId: string, user: any, userName: string, token: string | null) {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);

  useEffect(() => {
    let isMounted = true;
    const initChatClient = async () => {
      const chat = new StreamChat(config.STREAM_APIKEY);
      await chat.connectUser(
        {
          id: userId,
          image: user,
          name: userName
        },
        token
      );
      if (isMounted) setChatClient(chat);
    };
    if (userId && token && !chatClient) {
      initChatClient();
    }
    return () => {
      isMounted = false;
      if (chatClient) {
        chatClient.disconnectUser();
        setChatClient(null);
      }
    };
  }, [userId, token]);

  return chatClient;
} 