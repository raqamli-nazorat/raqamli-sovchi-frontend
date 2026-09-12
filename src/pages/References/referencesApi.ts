import dayjs from "dayjs";
import { axiosAPI } from "../../lib/axiosAPI";

export type RefItem = Record<string, any> & { id: string };

export interface RefApi {
  list: (params?: Record<string, any>) => Promise<RefItem[]>;
  get: (id: string) => Promise<RefItem>;
  create: (data: Record<string, any>) => Promise<RefItem>;
  update: (id: string, data: Record<string, any>) => Promise<RefItem>;
  remove: (id: string) => Promise<void>;
}

// Javob {count,next,previous,results} yoki {success,data:{...}} ko'rinishida
// bo'lishi mumkin — ikkalasini ham qo'llab-quvvatlaymiz.
const unwrap = (res: any) => {
  const payload = res?.data?.data ?? res?.data;
  const results = payload?.results ?? payload;
  if (Array.isArray(results)) {
    const arr = [...results] as any;
    if (payload && typeof payload === "object") {
      if (typeof payload.count === "number") {
        arr.count = payload.count;
      }
      if (payload.next !== undefined) {
        arr.next = payload.next;
      }
    }
    return arr;
  }
  return results;
};

const realApi = (base: string): RefApi => ({
  list: async (params) => {
    const items = unwrap(await axiosAPI.get(base, { params }));
    return Array.isArray(items) ? items : [];
  },
  get: async (id) => unwrap(await axiosAPI.get(`${base}${id}/`)),
  create: async (data) => unwrap(await axiosAPI.post(base, data)),
  update: async (id, data) => unwrap(await axiosAPI.patch(`${base}${id}/`, data)),
  remove: async (id) => {
    await axiosAPI.delete(`${base}${id}/`);
  },
});

// Xabarlar uchun mock data (keyinchalik backend tayyor bo'lgach realApi("messages/") ga almashtiriladi)
const INITIAL_MESSAGES: RefItem[] = [
  {
    id: "1",
    name: "Assalomu aleykum",
    created_at: "2026-03-12T14:02:00",
    updated_at: "2026-06-18T09:31:00",
  },
  {
    id: "2",
    name: "Nima",
    created_at: "2026-03-12T08:25:00",
    updated_at: "2026-04-02T12:32:00",
  },
  {
    id: "3",
    name: "Kim",
    created_at: "2026-04-18T15:28:00",
    updated_at: "2026-05-30T13:14:00",
  },
  {
    id: "4",
    name: "Qanaqa",
    created_at: "2026-05-02T10:27:00",
    updated_at: "2026-07-11T16:54:00",
  },
  {
    id: "5",
    name: "Qatta",
    created_at: "2026-06-21T09:22:00",
    updated_at: "2026-06-21T12:22:00",
  },
];

const STORAGE_KEY = "mock_messages_data";

const getMockMessages = (): RefItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return [...INITIAL_MESSAGES];
};

const setMockMessages = (items: RefItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
};

const mockMessagesApi: RefApi = {
  list: async (params) => {
    let list = getMockMessages();
    if (params?.search) {
      const q = String(params.search).toLowerCase().trim();
      list = list.filter((item) => (item.name || "").toLowerCase().includes(q));
    }
    if (params?.start_date) {
      const start = dayjs(params.start_date).startOf("day").valueOf();
      list = list.filter((item) => dayjs(item.created_at).valueOf() >= start);
    }
    if (params?.end_date) {
      const end = dayjs(params.end_date).endOf("day").valueOf();
      list = list.filter((item) => dayjs(item.created_at).valueOf() <= end);
    }
    if (params?.updated_at_after) {
      const start = dayjs(params.updated_at_after).startOf("day").valueOf();
      list = list.filter((item) => dayjs(item.updated_at).valueOf() >= start);
    }
    if (params?.updated_at_before) {
      const end = dayjs(params.updated_at_before).endOf("day").valueOf();
      list = list.filter((item) => dayjs(item.updated_at).valueOf() <= end);
    }

    const res: any = [...list];
    res.count = list.length;
    return res;
  },
  get: async (id) => {
    const list = getMockMessages();
    const item = list.find((i) => String(i.id) === String(id));
    if (!item) throw new Error("Xabar topilmadi");
    return item;
  },
  create: async (data) => {
    const list = getMockMessages();
    const now = dayjs().format("YYYY-MM-DDTHH:mm:ss");
    const newItem: RefItem = {
      id: String(Date.now()),
      name: data.name || "",
      created_at: now,
      updated_at: now,
    };
    const updated = [newItem, ...list];
    setMockMessages(updated);
    return newItem;
  },
  update: async (id, data) => {
    const list = getMockMessages();
    const now = dayjs().format("YYYY-MM-DDTHH:mm:ss");
    const idx = list.findIndex((i) => String(i.id) === String(id));
    if (idx === -1) throw new Error("Xabar topilmadi");
    const updatedItem = {
      ...list[idx],
      ...data,
      updated_at: now,
    };
    list[idx] = updatedItem;
    setMockMessages(list);
    return updatedItem;
  },
  remove: async (id) => {
    const list = getMockMessages();
    const filtered = list.filter((i) => String(i.id) !== String(id));
    setMockMessages(filtered);
  },
};

// Ma'lumotnomalar bo'limi — backend endpointlariga to'liq ulangan.
// (Manba: /api/schema/ — Raqamli Sovchi API v1)
export const REF_APIS: Record<string, RefApi> = {
  roles: realApi("accounts/roles/"),
  regions: realApi("locations/region/"),
  districts: realApi("locations/district/"),
  "education-levels": realApi("references/education-levels/"),
  nationalities: realApi("references/nationalities/"),
  professions: realApi("references/professions/"),
  sections: realApi("accounts/section-types/"),
  questions: realApi("accounts/questions/"),
  // Hozircha mock data, keyin real API ulanadi (masalan: realApi("messages/"))
  messages: mockMessagesApi,
};

export const refApiError = (err: any, fallback: string): string => {
  const apiError = err?.response?.data?.error;
  if (apiError) {
    if (apiError.details) {
      if (typeof apiError.details === "object") {
        return Object.values(apiError.details).flat().join(", ");
      }
      return String(apiError.details);
    }
    return apiError.errorMsg || fallback;
  }
  return err?.response?.data?.detail || err?.response?.data?.message || err?.message || fallback;
};
