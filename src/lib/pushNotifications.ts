// FCM (Firebase Cloud Messaging) push — STUB / skelet.
//
// Hozir Firebase LOYIHASI ulanmagan: `getFcmToken()` `null` qaytaradi va butun
// oqim jimgina o'tadi (hech qanday so'rov, hech qanday konsol xatosi). WebSocket
// va count-fallback bildirishnomani baribir yetkazgani uchun push ikkilamchi kanal.
//
// Firebase sozlangach ishga tushirish (chaqiruv kodi O'ZGARMAYDI):
//   1) npm i firebase
//   2) .env'ga VITE_FIREBASE_* kalitlari + VITE_FIREBASE_VAPID_KEY qo'shiladi
//   3) public/firebase-messaging-sw.js service worker fayli qo'shiladi
//   4) pastdagi getFcmToken() ichidagi izohli blok ochiladi
//
// Backend endpointlari (allaqachon notificationsApi'da ulangan):
//   POST   accounts/notifications/devices/register/  { fcm_token, device_type, device_id }
//   DELETE accounts/notifications/devices/current/

import { notificationsApi } from "./notificationsApi";

const DEVICE_ID_KEY = "notif_device_id";

// Shu sessiyada backendga yuborilgan oxirgi token — takroriy register'ni oldini oladi.
let registeredToken: string | null = null;
// Bir vaqtda bir nechta chaqiruv bo'lsa ham register faqat bir marta ketadi.
let inFlight: Promise<void> | null = null;

// Brauzer uchun barqaror qurilma identifikatori (bir marta yaratiladi, saqlanadi).
const getDeviceId = (): string => {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return `web-${Date.now()}`;
  }
};

const firebaseEnv = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
};

// Hamma kalit to'ldirilgan bo'lsagina Firebase'ni jonlantirishga urinamiz.
const isFirebaseConfigured = Object.values(firebaseEnv).every(
  (v) => typeof v === "string" && v.length > 0
);

/**
 * FCM tokenini oladi. Firebase ulanmagan bo'lsa — `null` (stub).
 *
 * Firebase sozlangach quyidagi blokni oching (`npm i firebase` shart bo'ladi):
 *
 *   if (!("serviceWorker" in navigator)) return null;
 *   const { initializeApp, getApps } = await import("firebase/app");
 *   const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
 *   if (!(await isSupported())) return null;
 *   const app =
 *     getApps()[0] ??
 *     initializeApp({
 *       apiKey: firebaseEnv.apiKey,
 *       projectId: firebaseEnv.projectId,
 *       messagingSenderId: firebaseEnv.messagingSenderId,
 *       appId: firebaseEnv.appId,
 *     });
 *   const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
 *   return await getToken(getMessaging(app), {
 *     vapidKey: firebaseEnv.vapidKey,
 *     serviceWorkerRegistration: swReg,
 *   });
 */
const getFcmToken = async (): Promise<string | null> => {
  if (!isFirebaseConfigured) return null;
  // ↓ Firebase sozlangach yuqoridagi implementatsiya shu yerga qo'yiladi.
  return null;
};

/**
 * Qurilmani push uchun ro'yxatga oladi. Barcha xatolar yutiladi — push ishlamasa
 * ham bildirishnoma WebSocket / count-fallback orqali baribir keladi.
 * OS bildirishnoma ruxsati berilgan bo'lishi shart.
 */
export const registerPushDevice = (): Promise<void> => {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const token = await getFcmToken();
      if (!token || token === registeredToken) return;
      await notificationsApi.registerDevice({
        fcm_token: token,
        device_type: "web",
        device_id: getDeviceId(),
      });
      registeredToken = token;
    } catch {
      /* stub yoki tarmoq xatosi — jimgina o'tamiz */
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
};

/** Joriy qurilmani push ro'yxatidan chiqaradi (logout / hook cleanup). */
export const unregisterPushDevice = async (): Promise<void> => {
  if (!registeredToken) return; // stub holatida hech qachon ro'yxatga olinmagan
  registeredToken = null;
  try {
    await notificationsApi.unregisterDevice();
  } catch {
    /* best-effort */
  }
};
