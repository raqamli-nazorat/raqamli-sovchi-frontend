import { axiosAPI } from "./axiosAPI";

// ── OpenAPI / Swagger: Complaint Schemas & Endpoints ──
// GET    /api/v1/accounts/complaints/             → Shikoyatlar ro'yxatini olish
// POST   /api/v1/accounts/complaints/             → Foydalanuvchilar o'rtasidagi shikoyatni yaratish
// GET    /api/v1/accounts/complaints/{id}/        → Shikoyat tafsilotini olish
// PUT    /api/v1/accounts/complaints/{id}/        → Shikoyat ma'lumotlarini to'liq yangilash
// PATCH  /api/v1/accounts/complaints/{id}/        → Shikoyat ma'lumotlarini qisman yangilash
// POST   /api/v1/accounts/complaints/{id}/decision/ → Shikoyat bo'yicha admin qarorini saqlash
// GET    /api/v1/accounts/complaints/my/          → Foydalanuvchining o'z shikoyatlarini olish

export type ComplaintReason =
  | "abusive_language"
  | "fake_profile"
  | "fraud"
  | "spam"
  | "false_information"
  | "threat"
  | "no_serious_intent"
  | "other";

export type ComplaintStatus = "pending" | "approved" | "rejected";

export const COMPLAINT_REASONS: { value: ComplaintReason; label: string }[] = [
  { value: "abusive_language", label: "Odobsiz so'z" },
  { value: "fake_profile", label: "Soxta profil" },
  { value: "fraud", label: "Firibgarlik" },
  { value: "spam", label: "Spam va reklama" },
  { value: "false_information", label: "Noto'g'ri ma'lumot" },
  { value: "threat", label: "Haqorat va tahdid" },
  { value: "no_serious_intent", label: "Nikoh niyati yo'q" },
  { value: "other", label: "Boshqa" },
];

export const COMPLAINT_REASON_MAP: Record<string, string> = {
  abusive_language: "Odobsiz so'z",
  fake_profile: "Soxta profil",
  fraud: "Firibgarlik",
  spam: "Spam va reklama",
  false_information: "Noto'g'ri ma'lumot",
  threat: "Haqorat va tahdid",
  no_serious_intent: "Nikoh niyati yo'q",
  other: "Boshqa",
};

export const COMPLAINT_STATUS_MAP: Record<string, string> = {
  pending: "Ko'rib chiqilmoqda",
  approved: "Tasdiqlandi",
  rejected: "Bekor qilindi",
  in_review: "Ko'rib chiqilmoqda",
};

export interface UserProfileInfo {
  id?: string;
  first_name?: string;
  last_name?: string;
  gender?: string;
  photo?: string | null;
  birth_date?: string;
  region_name?: string;
  district_name?: string;
  [key: string]: any;
}

export interface ComplaintUserInfo {
  id: string;
  phone_number?: string | null;
  email?: string | null;
  display_id: string;
  full_name: string;
  profile_info?: UserProfileInfo | null;
}

export interface ComplaintListItem {
  id: string;
  reason: ComplaintReason | string;
  reason_label?: string;
  status: ComplaintStatus | string;
  status_label?: string;
  created_at: string;
  from_user_info?: ComplaintUserInfo | null;
  to_user_info?: ComplaintUserInfo | null;
}

export interface ComplaintDetail {
  id: string;
  reason: ComplaintReason | string;
  reason_label?: string;
  message?: string | null;
  evidence?: any | null;
  status: ComplaintStatus | string;
  status_label?: string;
  admin_note?: string | null;
  resolved_at?: string | null;
  conversation_excerpt?: any;
  profile_snapshot?: any;
  ai_analysis?: any;
  previous_complaints_count?: string | number;
  created_at: string;
  updated_at?: string;
  from_user_info?: ComplaintUserInfo | null;
  to_user_info?: ComplaintUserInfo | null;
  resolved_by_info?: ComplaintUserInfo | null;
  chat_room_info?: {
    id: string;
    [key: string]: any;
  } | null;
}

export interface ComplaintDecisionRequest {
  decision: "approved" | "rejected";
  admin_note?: string | null;
}

export interface ComplaintDecision {
  id: string;
  status: ComplaintStatus | string;
  status_label: string;
  admin_note?: string | null;
  resolved_at?: string | null;
  updated_at: string;
  resolved_by_info?: ComplaintUserInfo | null;
}

export interface ComplaintListParams {
  search?: string;
  reason?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  created_at_after?: string;
  created_at_before?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
  [key: string]: any;
}

export interface ComplaintPageResult {
  results: ComplaintListItem[];
  count: number;
  next: string | null;
  previous: string | null;
}

const BASE = "accounts/complaints/";

const unwrap = (res: any) => res?.data?.data ?? res?.data;

export const complaintsApi = {
  // Shikoyatlar ro'yxati
  list: async (params: ComplaintListParams = {}): Promise<ComplaintPageResult> => {
    const cleanParams: Record<string, any> = { ...params };
    if (!cleanParams.search?.trim()) delete cleanParams.search;
    if (cleanParams.reason === "Barchasi") delete cleanParams.reason;
    if (cleanParams.status === "Barchasi") delete cleanParams.status;

    // Remove undefined, null, or empty string values
    Object.keys(cleanParams).forEach((key) => {
      if (
        cleanParams[key] === undefined ||
        cleanParams[key] === null ||
        cleanParams[key] === ""
      ) {
        delete cleanParams[key];
      }
    });

    const payload = unwrap(await axiosAPI.get(BASE, { params: cleanParams }));
    const results: ComplaintListItem[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.results)
      ? payload.results
      : [];

    return {
      results,
      count: Array.isArray(payload) ? results.length : payload?.count ?? results.length,
      next: Array.isArray(payload) ? null : payload?.next ?? null,
      previous: Array.isArray(payload) ? null : payload?.previous ?? null,
    };
  },

  // Bitta shikoyat tafsilotini olish
  get: async (id: string): Promise<ComplaintDetail> => {
    const payload = unwrap(await axiosAPI.get(`${BASE}${id}/`));
    return payload;
  },

  // Shikoyat bo'yicha admin qarorini saqlash (Tasdiqlash / Bekor qilish)
  decision: async (
    id: string,
    body: ComplaintDecisionRequest
  ): Promise<ComplaintDecision> => {
    const payload = unwrap(await axiosAPI.post(`${BASE}${id}/decision/`, body));
    return payload;
  },

  // Yangi shikoyat yaratish
  create: async (data: Record<string, any>): Promise<ComplaintDetail> => {
    const payload = unwrap(await axiosAPI.post(BASE, data));
    return payload;
  },

  // Shikoyatni to'liq yangilash
  update: async (id: string, data: Record<string, any>): Promise<ComplaintDetail> => {
    const payload = unwrap(await axiosAPI.put(`${BASE}${id}/`, data));
    return payload;
  },

  // Shikoyatni qisman yangilash
  partialUpdate: async (
    id: string,
    data: Record<string, any>
  ): Promise<ComplaintDetail> => {
    const payload = unwrap(await axiosAPI.patch(`${BASE}${id}/`, data));
    return payload;
  },

  // Foydalanuvchining o'z shikoyatlarini olish
  myList: async (params: Record<string, any> = {}): Promise<ComplaintPageResult> => {
    const payload = unwrap(await axiosAPI.get(`${BASE}my/`, { params }));
    const results: ComplaintListItem[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.results)
      ? payload.results
      : [];

    return {
      results,
      count: Array.isArray(payload) ? results.length : payload?.count ?? results.length,
      next: Array.isArray(payload) ? null : payload?.next ?? null,
      previous: Array.isArray(payload) ? null : payload?.previous ?? null,
    };
  },
};

// ── Parsing & Formatting Helpers ──

export interface ParsedChatMessage {
  side: "left" | "right";
  text: string;
  time: string;
  flagged?: boolean;
}

export const parseConversationExcerpt = (
  raw: any,
  fromUser?: ComplaintUserInfo | null,
  _toUser?: ComplaintUserInfo | null
): ParsedChatMessage[] => {
  if (!raw) return [];

  let data = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      const lines = raw.split("\n").filter((l: string) => l.trim().length > 0);
      if (lines.length > 0) {
        return lines.map((line: string, idx: number) => {
          const isSecond = idx % 2 === 1;
          return {
            side: isSecond ? "right" : "left",
            text: line.trim(),
            time: "",
            flagged: /rasm|pul|haqorat|karta|telefon|telegram/i.test(line),
          };
        });
      }
      return [{ side: "left", text: raw, time: "" }];
    }
  }

  if (Array.isArray(data)) {
    return data.map((item: any) => {
      if (typeof item === "string") {
        return { side: "left", text: item, time: "" };
      }
      const side: "left" | "right" =
        item.side === "right" || item.side === "left"
          ? item.side
          : item.sender_id && fromUser && String(item.sender_id) === String(fromUser.id)
          ? "left"
          : "right";

      const time = item.time || item.created_at || item.timestamp || "";
      const formattedTime = time && time.includes("T") ? time.split("T")[1]?.slice(0, 5) : time;

      return {
        side,
        text: item.text || item.message || item.content || "",
        time: formattedTime || "",
        flagged: Boolean(item.flagged || item.is_flagged || item.violation),
      };
    });
  }

  if (typeof data === "object" && data !== null) {
    if (Array.isArray(data.messages)) {
      return parseConversationExcerpt(data.messages, fromUser, _toUser);
    }
    if (Array.isArray(data.history)) {
      return parseConversationExcerpt(data.history, fromUser, _toUser);
    }
  }

  return [];
};

export interface ParsedAiAnalysis {
  level: string;
  warnings: string;
  reports: string;
  advice: string;
}

export const parseAiAnalysis = (
  raw: any,
  previousCount?: string | number
): ParsedAiAnalysis => {
  const fallbackReports =
    previousCount !== undefined && previousCount !== null
      ? `${previousCount} ta`
      : "1 ta";

  if (!raw) {
    return {
      level: "O'rta",
      warnings: "0 marta",
      reports: fallbackReports,
      advice: "Qo'shimcha tekshirish",
    };
  }

  let data = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return {
        level: raw.length > 50 ? "Yuqori" : "O'rta",
        warnings: "1 marta",
        reports: fallbackReports,
        advice: raw,
      };
    }
  }

  if (typeof data === "object" && data !== null) {
    return {
      level: data.level || data.risk_level || data.severity || "O'rta",
      warnings: data.warnings
        ? typeof data.warnings === "number"
          ? `${data.warnings} marta`
          : String(data.warnings)
        : "0 marta",
      reports: data.reports
        ? typeof data.reports === "number"
          ? `${data.reports} ta`
          : String(data.reports)
        : fallbackReports,
      advice: data.advice || data.recommendation || data.summary || "Qo'shimcha tekshirish",
    };
  }

  return {
    level: "O'rta",
    warnings: "0 marta",
    reports: fallbackReports,
    advice: "Qo'shimcha tekshirish",
  };
};

export interface ParsedProfileSnapshot {
  status: string;
  registered: string;
  questionnaire: string;
  aiSignals: string;
}

export const parseProfileSnapshot = (
  raw: any,
  toUser?: ComplaintUserInfo | null
): ParsedProfileSnapshot => {
  let data = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { note: raw };
    }
  }

  const userProfile = toUser?.profile_info;

  return {
    status:
      data?.status ||
      (userProfile?.is_blocked ? "Bloklangan" : "Faol"),
    registered:
      data?.registered ||
      (toUser && (toUser as any).created_at
        ? (toUser as any).created_at.slice(0, 10)
        : "01.01.2026"),
    questionnaire:
      data?.questionnaire ||
      data?.completion ||
      "30/30 · 100%",
    aiSignals:
      data?.aiSignals ||
      data?.ai_signals ||
      (data?.signals_count !== undefined ? `${data.signals_count} ta` : "2 ta"),
  };
};

export const getInitials = (name?: string | null, fallback = "US"): string => {
  if (!name || !name.trim()) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};
