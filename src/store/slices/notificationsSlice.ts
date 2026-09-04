import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import {
  notificationsApi,
  type NotificationItem,
} from "../../lib/notificationsApi";
import type { WsStatus } from "../../lib/notificationSocket";

interface NotificationsState {
  // navbar badge
  unreadCount: number;
  countLoaded: boolean;
  // bildirishnomalar sahifasi ro'yxati
  items: NotificationItem[];
  page: number;
  hasMore: boolean;
  total: number;
  listLoading: boolean;
  listLoadingMore: boolean;
  listError: string | null;
  markingAll: boolean;
  // joriy ro'yxat filtri: "all" (hammasi) yoki "unread" (?is_read=false)
  filter: "all" | "unread";
  // real-time WebSocket holati
  wsStatus: WsStatus;
  // WS orqali endi kelgan, hali ko'rsatilmagan popup-toastlar navbati
  // (tab faol/fon bo'lishidan qat'i nazar — bildirishnoma DARHOL ko'rinishi uchun)
  toastQueue: NotificationItem[];
}

const initialState: NotificationsState = {
  unreadCount: 0,
  countLoaded: false,
  items: [],
  page: 1,
  hasMore: true,
  total: 0,
  listLoading: false,
  listLoadingMore: false,
  listError: null,
  markingAll: false,
  filter: "all",
  wsStatus: "CLOSED",
  toastQueue: [],
};

// WS/push payloadidan Notification obyektini normallashtirish.
// Backend turli shakl yuborishi mumkin: tekis obyekt, {type,data:{...}}, {notification:{...}} va h.k.
type AnyObj = Record<string, unknown>;
const isObj = (v: unknown): v is AnyObj => !!v && typeof v === "object";

// YAGONA DEDUP DARVOZASI (modul darajasida, Redux state emas — shu sabab reduxda
// serializatsiya ogohlantirishi yo'q, useNotificationsRealtime'dagi shownDesktopIds
// bilan bir xil naqsh): WS uzilib qayta ulanganda backend o'qilmagan bildirishnomalarni
// QAYTA yuborishi mumkin. Agar dedup faqat `state.items` bo'yicha bo'lsa — foydalanuvchi
// hali ro'yxatni ochmagan bo'lsa (items bo'sh) — har reconnectda son cheksiz oshib ketardi.
// Haqiqiy `id`ga ega har bir xabar shu sessiyada FAQAT bir marta hisoblanadi.
const seenNotificationIds = new Set<string>();

const normalizeIncoming = (raw: unknown): NotificationItem | null => {
  let n: AnyObj | null = isObj(raw) ? raw : null;
  if (n) {
    if (isObj(n.data) && (n.type === "notification" || n.type === "notify" || n.event)) {
      n = n.data;
    } else if (isObj(n.notification) && n.id == null) {
      n = {
        ...(isObj(n.data) ? n.data : {}),
        title: n.notification.title,
        message: n.notification.body,
      };
    }
  }
  if (!n) return null;
  // xizmat xabarlari (ping/pong/ack) — bildirishnoma emas
  if (n.id == null && !n.title && !n.message) return null;
  return {
    id: String(n.id ?? `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    title: typeof n.title === "string" ? n.title : "",
    message: typeof n.message === "string" ? n.message : "",
    extra_data: n.extra_data ?? null,
    is_read: n.is_read === true,
    created_at: typeof n.created_at === "string" ? n.created_at : new Date().toISOString(),
  };
};

// ── Thunks ───────────────────────────────────────────────────────────────────
// MUHIM: count faqat shu joylarda chaqiriladi — mount, tab qayta faollashganda
// (Navbar'da 60s throttle bilan) va o'qilgan/hammasini o'qilgan amalidan keyin.
// Hech qanday setInterval / polling YO'Q.
export const fetchUnreadCount = createAsyncThunk(
  "notifications/fetchUnreadCount",
  () => notificationsApi.count()
);

// Har chaqiruvda API'ga so'rov ketadi (client-side filtr YO'Q).
// isRead === false → ?is_read=false; isRead === undefined → hammasi.
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  (arg: { page?: number; isRead?: boolean } = {}) =>
    notificationsApi.list({
      page: arg.page ?? 1,
      ...(typeof arg.isRead === "boolean" ? { is_read: arg.isRead } : {}),
    })
);

export const markNotificationRead = createAsyncThunk(
  "notifications/markNotificationRead",
  async (id: string) => {
    try {
      await notificationsApi.markRead(id);
    } catch (err) {
      // 400/404 — "allaqachon o'qilgan / topilmadi": yakuniy holat baribir "o'qilgan",
      // shuning uchun bu xato emas — optimistik holatni rollback QILMAYMIZ.
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 400 || status === 404) return id;
      throw err; // tarmoq / 5xx — haqiqiy xato, .rejected optimistik holatni qaytaradi
    }
    return id;
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllNotificationsRead",
  () => notificationsApi.markAllRead()
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    // Sahifa qayta ochilganda ro'yxatni toza boshlash uchun
    resetNotifications: (state) => {
      state.items = [];
      state.page = 1;
      state.hasMore = true;
      state.listError = null;
    },

    // Real-time WebSocket'dan yangi bildirishnoma kelganda.
    // count uchun so'rov YUBORILMAYDI — sonni shu yerda oshiramiz.
    notificationReceived: (state, { payload }: PayloadAction<unknown>) => {
      const n = normalizeIncoming(payload);
      if (!n) return;
      // Reconnect'da backend qayta yuborgan (haqiqiy id'li) xabar — shu sessiyada
      // avval ko'rilgan bo'lsa hisobga qo'shilmaydi. `items` bo'sh bo'lsa ham ishlaydi.
      const hasRealId = !n.id.startsWith("tmp-");
      if (hasRealId) {
        if (seenNotificationIds.has(n.id)) return;
        seenNotificationIds.add(n.id);
      }
      const dup = state.items.some((it) => it.id === n.id);
      if (dup) return;
      // Joriy ro'yxat filtriga mos kelsa — boshiga qo'shamiz
      if (state.filter === "all" || !n.is_read) {
        state.items.unshift(n);
      }
      state.total += 1;
      if (!n.is_read) state.unreadCount += 1;
      // Tab fon/faolligidan qat'i nazar DARHOL ko'rinadigan popup — oxirgi 4 tasi yetarli.
      if (!n.is_read) {
        state.toastQueue.push(n);
        if (state.toastQueue.length > 4) state.toastQueue.shift();
      }
    },

    // Toast ko'rsatilib bo'lgach (avto-yopilish yoki qo'lda yopish) navbatdan olib tashlanadi.
    dismissToast: (state, { payload }: PayloadAction<string>) => {
      state.toastQueue = state.toastQueue.filter((n) => n.id !== payload);
    },

    setWsStatus: (state, { payload }: PayloadAction<WsStatus>) => {
      state.wsStatus = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── count ──
      .addCase(fetchUnreadCount.fulfilled, (state, { payload }) => {
        state.unreadCount = payload;
        state.countLoaded = true;
      })

      // ── ro'yxat ──
      .addCase(fetchNotifications.pending, (state, { meta }) => {
        const page = meta.arg?.page ?? 1;
        state.filter = meta.arg?.isRead === false ? "unread" : "all";
        if (page === 1) state.listLoading = true;
        else state.listLoadingMore = true;
        state.listError = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, { payload, meta }) => {
        const page = meta.arg?.page ?? 1;
        const unreadOnly = meta.arg?.isRead === false;
        state.listLoading = false;
        state.listLoadingMore = false;
        state.page = page;
        state.hasMore = !!payload.next;
        // Paginatsiyalangan `count` — filtrga qarab: hammasi yoki o'qilmaganlar soni.
        if (unreadOnly) {
          state.unreadCount = payload.count;
          state.countLoaded = true;
        } else {
          state.total = payload.count;
        }
        if (page === 1) {
          state.items = payload.results;
        } else {
          const known = new Set(state.items.map((n) => n.id));
          state.items.push(...payload.results.filter((n) => !known.has(n.id)));
        }
      })
      .addCase(fetchNotifications.rejected, (state, { meta, error }) => {
        const page = meta.arg?.page ?? 1;
        state.listLoading = false;
        state.listLoadingMore = false;
        if (page === 1) {
          state.listError = error.message ?? "Bildirishnomalarni yuklashda xatolik.";
        } else {
          // keyingi sahifada xato — qayta-qayta urinmaymiz
          state.hasMore = false;
        }
      })

      // ── bitta o'qilgan (optimistik) ──
      .addCase(markNotificationRead.pending, (state, { meta }) => {
        const item = state.items.find((n) => n.id === meta.arg);
        if (item && !item.is_read) {
          item.is_read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      // So'rov muvaffaqiyatsiz bo'lsa — optimistik o'zgarishni qaytaramiz.
      .addCase(markNotificationRead.rejected, (state, { meta }) => {
        const item = state.items.find((n) => n.id === meta.arg);
        if (item && item.is_read) {
          item.is_read = false;
          state.unreadCount += 1;
        }
      })

      // ── hammasini o'qilgan ──
      .addCase(markAllNotificationsRead.pending, (state) => {
        state.markingAll = true;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.markingAll = false;
        state.items.forEach((n) => {
          n.is_read = true;
        });
        state.unreadCount = 0;
      })
      .addCase(markAllNotificationsRead.rejected, (state) => {
        state.markingAll = false;
      });
  },
});

export const { resetNotifications, notificationReceived, dismissToast, setWsStatus } =
  notificationsSlice.actions;

export default notificationsSlice.reducer;
