import { useState, useEffect } from 'react';

export function useProfileImageUpsert(chatClient: any, userId: string, userStr2: any, userData: any, volunteerID: string) {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [lastUpsertedImages, setLastUpsertedImages] = useState<{[id: string]: string}>({});

  useEffect(() => {
    const loadProfileImages = async () => {
      if (!chatClient || !userId || !userStr2 || !userData || !volunteerID) return;
      const updates: any[] = [];
      if (lastUpsertedImages[userId] !== (userStr2.profileImage || '')) {
        updates.push({ id: userId, image: userStr2.profileImage || '' });
      }
      if (lastUpsertedImages[volunteerID] !== (userData.profileImage || '')) {
        updates.push({ id: volunteerID, image: userData.profileImage || '' });
      }
      if (updates.length === 0) {
        setImagesLoaded(true);
        return;
      }
      try {
        for (const user of updates) {
          await chatClient.upsertUser(user);
        }
        setLastUpsertedImages((prev) => ({
          ...prev,
          ...Object.fromEntries(updates.map(u => [u.id, u.image]))
        }));
        setImagesLoaded(true);
      } catch (e) {
        setImagesLoaded(true);
      }
    };
    loadProfileImages();
  }, [chatClient, userId, userStr2?.profileImage, userData?.profileImage, volunteerID]);

  return imagesLoaded;
} 