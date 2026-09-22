import { useState, useEffect } from 'react';
import { StreamChat } from 'stream-chat';
import config from '../../config';

export function useStreamChatClient(userId: string, user: any, userName: string, token: string | null) {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);

  useEffect(() => {
    let isMounted = true;
    const initChatClient = async () => {
      const chat = new StreamChat(config.STREAM_APIKEY);
      const userImage = typeof user === 'string' ? user : user?.image;
      await chat.connectUser(
        {
          id: userId,
          ...(userImage && { image: userImage }),
          name: userName || "Dispatcher"
        },
        token
      );
      if (userName && chat.user && chat.user.name !== userName) {
        try {
          await chat.upsertUser({
            id: userId,
            name: userName,
            ...(userImage && { image: userImage }),
          });
        } catch (e) {
          console.warn("Could not upsert user name in Stream:", e);
        }
      }
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