import { axiosAPI } from "./axiosAPI";

// Manba: /api/schema/ — "Accounts (Notifications)"
//   GET    accounts/notifications/                 → PaginatedNotificationList
//   GET    accounts/notifications/count/           → o'qilmaganlar soni
//   PATCH  accounts/notifications/{id}/read/       → bitta bildirishnomani o'qilgan qilish
//   POST   accounts/notifications/read-all/        → hammasini o'qilgan qilish
//   POST   accounts/notifications/tickets/         → real-time WebSocket uchun bir martalik ticket
//   POST   accounts/notifications/devices/register/→ FCM push qurilmasini ro'yxatga olish
//   DELETE accounts/notifications/devices/current/ → joriy qurilmani o'chirish

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  extra_data?: unknown;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPageResult {
  results: NotificationItem[];
  count: number;
  next: string | null;
}

export interface DeviceRegisterPayload {
  fcm_token: string;
  device_type: "web" | "ios" | "android";
  device_id: string;
}

const BASE = "accounts/notifications/";

// Backend javobi {count,next,previous,results} yoki {success,data:{...}}
// ko'rinishida bo'lishi mumkin — ikkalasini ham qo'llaymiz (referencesApi bilan bir xil).
const unwrap = (res: any) => res?.data?.data ?? res?.data;

const listNotifications = async (
  params: { page?: number; is_read?: boolean } = {}
): Promise<NotificationPageResult> => {
  const payload = unwrap(await axiosAPI.get(BASE, { params }));
  const results: NotificationItem[] = Array.isArray(payload)
    ? payload
    : payload?.results ?? [];
  return {
    results,
    count: Array.isArray(payload) ? results.length : payload?.count ?? results.length,
    next: Array.isArray(payload) ? null : payload?.next ?? null,
  };
};

export const notificationsApi = {
  list: listNotifications,

  // O'qilmagan bildirishnomalar soni (navbar badge).
  // 1) maxsus count/ endpointi. 2) ishonchli zaxira: ?is_read=false ro'yxatining `count`i
  //    (paginatsiyalangan javob shakli barqaror — count/ noaniq JSON qaytarsa ham to'g'ri chiqadi).
  count: async (): Promise<number> => {
    try {
      const p = unwrap(await axiosAPI.get(`${BASE}count/`));
      const n =
        typeof p === "number"
          ? p
          : Number(p?.unread ?? p?.unread_count ?? p?.unseen ?? p?.count ?? NaN);
      if (Number.isFinite(n)) return n;
    } catch {
      /* zaxiraga o'tamiz */
    }
    const { count } = await listNotifications({ is_read: false, page: 1 });
    return count;
  },

  markRead: async (id: string): Promise<void> => {
    await axiosAPI.patch(`${BASE}${id}/read/`);
  },

  markAllRead: async (): Promise<void> => {
    await axiosAPI.post(`${BASE}read-all/`);
  },

  // Real-time WebSocket uchun bir martalik ticket (~60s). Har (re)connectda yangi olinadi.
  ticket: async (): Promise<string> => {
    const payload = unwrap(await axiosAPI.post(`${BASE}tickets/`));
    const ticket =
      typeof payload === "string"
        ? payload
        : payload?.ticket ?? payload?.token ?? payload?.key ?? "";
    if (!ticket) throw new Error("WebSocket ticket olinmadi");
    return ticket;
  },

  // FCM push — qurilmani ro'yxatga olish (fcm_token faqat Firebase sozlangach paydo bo'ladi).
  registerDevice: async (payload: DeviceRegisterPayload): Promise<void> => {
    await axiosAPI.post(`${BASE}devices/register/`, payload);
  },

  unregisterDevice: async (): Promise<void> => {
    await axiosAPI.delete(`${BASE}devices/current/`);
  },
};
