import { useState, useEffect } from 'react';

export function useProfileImageUpsert(chatClient: any, userId: string, userStr2: any, userData: any, volunteerID: string) {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [lastUpsertedKeys, setLastUpsertedKeys] = useState<{[id: string]: string}>({});

  useEffect(() => {
    const loadProfileImages = async () => {
      if (!chatClient || !userId || !userStr2 || !userData || !volunteerID) return;
      const updates: any[] = [];

      const dispatcherKey = userStr2.profileImage || '';
      if (lastUpsertedKeys[userId] !== dispatcherKey) {
        updates.push({ id: userId, image: dispatcherKey });
      }

      const volunteerName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
      const volunteerKey = `${userData.profileImage || ''}|${volunteerName}`;
      if (lastUpsertedKeys[volunteerID] !== volunteerKey) {
        updates.push({
          id: volunteerID,
          image: userData.profileImage || '',
          name: volunteerName || undefined,
        });
      }

      if (updates.length === 0) {
        setImagesLoaded(true);
        return;
      }
      try {
        for (const user of updates) {
          await chatClient.upsertUser(user);
        }
        setLastUpsertedKeys((prev) => ({
          ...prev,
          [userId]: dispatcherKey,
          [volunteerID]: volunteerKey,
        }));
        setImagesLoaded(true);
      } catch (e) {
        setImagesLoaded(true);
      }
    };
    loadProfileImages();
  }, [chatClient, userId, userStr2?.profileImage, userData?.profileImage, userData?.firstName, userData?.lastName, volunteerID]);

  return imagesLoaded;
}