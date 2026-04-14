export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | null {
  if (!isNotificationSupported()) return null;
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | null> {
  if (!isNotificationSupported()) return null;
  return await Notification.requestPermission();
}

/**
 * Show a browser notification for a new message.
 * No-ops if:
 *  - Notifications not supported / not granted
 *  - The tab is currently visible (message is already on screen)
 */
export function showMessageNotification(
  senderName: string,
  text: string,
  conversationName: string,
  conversationId: string,
): void {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== "granted") return;
  if (typeof document !== "undefined" && document.visibilityState === "visible")
    return;

  const body = text.length > 100 ? text.slice(0, 97) + "…" : text;

  const notification = new Notification(
    `${senderName} · ${conversationName}`,
    {
      body,
      // Groups notifications per conversation — new message replaces old one
      tag: `msg-${conversationId}`,
    },
  );

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}
