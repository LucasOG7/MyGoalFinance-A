// app/hooks/useNotifications.ts
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

export function useNotificationListeners() {
  useEffect(() => {
    const sub1 = Notifications.addNotificationReceivedListener((_n) => {
      // Aquí puedes mostrar banners propios, etc.
    });

    const sub2 = Notifications.addNotificationResponseReceivedListener((resp) => {
      const data = resp.notification.request.content.data as any;
      // Navega según lo que mande el backend
      if (data?.kind === 'news' && data?.id) {
        router.push(`/Screen/news`); // o detalle: `/Screen/news?article=${encodeURIComponent(data.id)}`
      } else if (data?.kind === 'fx') {
        router.push('/Screen/(tabs)/home'); // o una pantalla de tasas si la tienes
      }
    });

    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, []);
}
