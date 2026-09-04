import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../store";
import {
  fetchUnreadCount,
  notificationReceived,
  setWsStatus,
} from "../store/slices/notificationsSlice";
import { notificationsApi } from "../lib/notificationsApi";
import notificationSocket from "../lib/notificationSocket";
import { registerPushDevice, unregisterPushDevice } from "../lib/pushNotifications";

// VITE_BASE_URL (".../api/v1/") dan WS bazasi: wss://host
// Oqim: POST accounts/notifications/tickets/ → wss://host/ws/notifications/?ticket=<ticket>
const WS_BASE = (import.meta.env.VITE_BASE_URL || "")
  .replace(/\/api\/v1\/?$/, "")
  .replace(/^http/, "ws");

// To'liq WS URL'ni .env orqali ham berish mumkin (ticket avtomatik qo'shiladi)
const WS_PATH = import.meta.env.VITE_NOTIF_WS_URL || `${WS_BASE}/ws/notifications/`;

// Real-time WebSocket SUKUT BO'YICHA YOQILGAN (localhost dev'da ham) — .env'da
// VITE_ENABLE_WS="false" bilan butunlay o'chiriladi. Agar backend WS Origin
// validatsiyasi (masalan Django Channels AllowedHostsOriginValidator) joriy
// frontend originini rad etsa, ulanish 6 urinishdan keyin jim to'xtaydi va
// retryNow() 30s cooldown bilan cheklangan — shu bilan xavfsiz.
const WS_ENABLED = import.meta.env.VITE_ENABLE_WS !== "false";

// tab qayta faollashganda count resync — 60s'da eng ko'pi 1 marta
const COUNT_RESYNC_THROTTLE_MS = 60_000;

// ── OS/desktop bildirishnomasi (ruxsat berilgan bo'lsa) ──
const shownDesktopIds = new Set<string>();
const showDesktopNotification = (n: { id: string; title: string; message: string }) => {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    if (document.visibilityState === "visible") return; // faol tabda OS bildirishnomasi shart emas
    if (shownDesktopIds.has(n.id)) return;
    shownDesktopIds.add(n.id);
    const notif = new Notification(n.title || "Yangi bildirishnoma", {
      body: n.message || "",
      icon: "/Mark.svg",
      tag: n.id,
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch {
    /* ignore */
  }
};

/**
 * Real-time bildirishnomalar. Navbar (butun ilova umri davomida mount) dan chaqiriladi.
 *
 * count endpointi FAQAT quyidagi hollarda chaqiriladi (interval / polling YO'Q):
 *  - birinchi mount
 *  - WS bilan bog'lanib bo'lmagan holatda tab qayta faollashganda (60s throttle)
 * WS ochiq bo'lsa — yangi bildirishnomalar push orqali keladi, son shu yerda oshiriladi.
 */
export const useNotificationsRealtime = () => {
  const dispatch = useDispatch<AppDispatch>();
  const lastCountResyncRef = useRef(0);
  // WS kamida bir marta OPEN bo'lganmi — birinchi ulanishdagi keraksiz count
  // so'rovini oldini olish uchun (son mountda allaqachon olinadi).
  const wsHasOpenedRef = useRef(false);

  const resyncCount = useCallback(
    (force = false) => {
      const now = Date.now();
      if (!force && now - lastCountResyncRef.current < COUNT_RESYNC_THROTTLE_MS) return;
      lastCountResyncRef.current = now;
      dispatch(fetchUnreadCount());
    },
    [dispatch]
  );

  useEffect(() => {
    // 1) Boshlang'ich son
    lastCountResyncRef.current = Date.now();
    dispatch(fetchUnreadCount());

    // 2) OS bildirishnoma ruxsati + FCM push qurilmasini ro'yxatga olish.
    //    registerPushDevice() Firebase ulanmagan bo'lsa jimgina no-op (stub).
    if (typeof Notification !== "undefined") {
      if (Notification.permission === "granted") {
        registerPushDevice();
      } else if (Notification.permission === "default") {
        Notification.requestPermission()
          .then((perm) => {
            if (perm === "granted") registerPushDevice();
          })
          .catch(() => {});
      }
    }

    // 3) WebSocket
    let cancelled = false;
    const getTicketUrl = async () => {
      const ticket = await notificationsApi.ticket();
      return `${WS_PATH}?ticket=${encodeURIComponent(ticket)}`;
    };

    if (WS_ENABLED) {
      (async () => {
        try {
          const url = await getTicketUrl();
          if (cancelled) return;
          notificationSocket.connect(
            url,
            (data) => {
              dispatch(notificationReceived(data));
              // desktop bildirishnoma uchun yengil normalizatsiya
              const raw = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
              const nested =
                raw.data && typeof raw.data === "object"
                  ? (raw.data as Record<string, unknown>)
                  : raw;
              const title = typeof nested.title === "string" ? nested.title : "";
              const message = typeof nested.message === "string" ? nested.message : "";
              if (title || message) {
                showDesktopNotification({
                  id: String(nested.id ?? `tmp-${Date.now()}`),
                  title,
                  message,
                });
              }
            },
            getTicketUrl,
            (status) => {
              dispatch(setWsStatus(status));
              if (status === "OPEN") {
                // Birinchi ulanishda son mountda allaqachon olindi — takror so'rov shart emas.
                // Faqat QAYTA ulanishda sinxronlaymiz: uzilish paytida push o'tkazib
                // yuborilgan bo'lishi mumkin.
                if (wsHasOpenedRef.current) resyncCount(true);
                wsHasOpenedRef.current = true;
              }
            }
          );
        } catch {
          // ticket / WS ishlamadi — tab focus'da count resync fallback ishlaydi
        }
      })();
    }

    // 4) Tab qayta faollashganda: WS o'lik bo'lsa qayta ulanamiz + count resync (throttled)
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (WS_ENABLED && notificationSocket.status !== "OPEN") {
        notificationSocket.retryNow();
      }
      if (!WS_ENABLED || notificationSocket.status !== "OPEN") {
        resyncCount();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      notificationSocket.disconnect();
      // Logout / ilova yopilishi — bu qurilmani push ro'yxatidan chiqaramiz.
      // Stub holatida (Firebase yo'q) hech qachon ro'yxatga olinmagani uchun no-op.
      unregisterPushDevice();
    };
  }, [dispatch, resyncCount]);
};
