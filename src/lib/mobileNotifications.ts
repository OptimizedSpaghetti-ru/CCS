import { Capacitor } from "@capacitor/core";
import {
  LocalNotifications,
  type Channel,
  type LocalNotificationSchema,
} from "@capacitor/local-notifications";
import { Preferences } from "@capacitor/preferences";

export type MobileNotificationKind =
  | "announcement"
  | "system"
  | "reminder";

export type MobileNotificationPrefs = {
  enabled: boolean;
  announcements: boolean;
  scheduleChanges: boolean;
  systemAlerts: boolean;
};

const PREF_KEY = "ccs-mobile-notification-preferences";
const DELIVERED_KEY = "ccs-mobile-notification-delivered";
const MAX_DELIVERED_IDS = 80;

export const defaultMobileNotificationPrefs: MobileNotificationPrefs = {
  enabled: true,
  announcements: true,
  scheduleChanges: true,
  systemAlerts: true,
};

const channels: Channel[] = [
  {
    id: "announcements",
    name: "Announcements",
    description: "Campus announcements and faculty posts",
    importance: 4,
    visibility: 1,
    lights: true,
    vibration: true,
  },
  {
    id: "system-updates",
    name: "System Updates",
    description: "Account and system notifications",
    importance: 4,
    visibility: 1,
    lights: true,
    vibration: true,
  },
  {
    id: "reminders",
    name: "Reminders",
    description: "Schedule and reminder notifications",
    importance: 3,
    visibility: 1,
    lights: true,
    vibration: true,
  },
];

export function isMobileNotificationsSupported() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export async function getMobileNotificationPrefs() {
  const { value } = await Preferences.get({ key: PREF_KEY });
  if (!value) return defaultMobileNotificationPrefs;

  try {
    return {
      ...defaultMobileNotificationPrefs,
      ...(JSON.parse(value) as Partial<MobileNotificationPrefs>),
    };
  } catch {
    return defaultMobileNotificationPrefs;
  }
}

export async function saveMobileNotificationPrefs(
  prefs: MobileNotificationPrefs,
) {
  await Preferences.set({ key: PREF_KEY, value: JSON.stringify(prefs) });
}

export async function initializeMobileNotifications() {
  if (!isMobileNotificationsSupported()) {
    return { supported: false, granted: false };
  }

  for (const channel of channels) {
    await LocalNotifications.createChannel(channel);
  }

  const permission = await LocalNotifications.checkPermissions();
  if (permission.display === "granted") {
    return { supported: true, granted: true };
  }

  const requested = await LocalNotifications.requestPermissions();
  return { supported: true, granted: requested.display === "granted" };
}

async function getDeliveredIds() {
  const { value } = await Preferences.get({ key: DELIVERED_KEY });
  if (!value) return new Set<string>();

  try {
    const ids = JSON.parse(value) as string[];
    return new Set(ids);
  } catch {
    return new Set<string>();
  }
}

async function rememberDeliveredId(id: string) {
  const ids = await getDeliveredIds();
  ids.add(id);
  const next = Array.from(ids).slice(-MAX_DELIVERED_IDS);
  await Preferences.set({ key: DELIVERED_KEY, value: JSON.stringify(next) });
}

function numericNotificationId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || Date.now() % 2147483647;
}

function getChannelId(kind: MobileNotificationKind) {
  if (kind === "reminder") return "reminders";
  if (kind === "system") return "system-updates";
  return "announcements";
}

function isAllowedByPrefs(
  kind: MobileNotificationKind,
  prefs: MobileNotificationPrefs,
) {
  if (!prefs.enabled) return false;
  if (kind === "announcement") return prefs.announcements;
  if (kind === "reminder") return prefs.scheduleChanges;
  return prefs.systemAlerts;
}

export async function sendMobileNotification({
  id,
  title,
  body,
  kind,
  extra,
}: {
  id: string;
  title: string;
  body: string;
  kind: MobileNotificationKind;
  extra?: Record<string, string>;
}) {
  if (!isMobileNotificationsSupported()) return { delivered: false };

  const prefs = await getMobileNotificationPrefs();
  if (!isAllowedByPrefs(kind, prefs)) return { delivered: false };

  const deliveredIds = await getDeliveredIds();
  if (deliveredIds.has(id)) return { delivered: false };

  const permission = await LocalNotifications.checkPermissions();
  if (permission.display !== "granted") return { delivered: false };

  const notification: LocalNotificationSchema = {
    id: numericNotificationId(id),
    title,
    body,
    channelId: getChannelId(kind),
    extra: {
      notificationId: id,
      kind,
      ...extra,
    },
  };

  await LocalNotifications.schedule({ notifications: [notification] });
  await rememberDeliveredId(id);
  return { delivered: true };
}

export async function registerNotificationTapHandler(
  onOpen: (extra: Record<string, unknown>) => void,
) {
  if (!isMobileNotificationsSupported()) return () => {};

  const listener = await LocalNotifications.addListener(
    "localNotificationActionPerformed",
    (event) => {
      onOpen((event.notification.extra ?? {}) as Record<string, unknown>);
    },
  );

  return () => {
    listener.remove();
  };
}
