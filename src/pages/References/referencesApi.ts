import { axiosAPI } from "../../lib/axiosAPI";

export type RefItem = Record<string, any> & { id: string };

export interface RefApi {
  isMock: boolean;
  list: (params?: Record<string, any>) => Promise<RefItem[]>;
  get: (id: string) => Promise<RefItem>;
  create: (data: Record<string, any>) => Promise<RefItem>;
  update: (id: string, data: Record<string, any>) => Promise<RefItem>;
  remove: (id: string) => Promise<void>;
}

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
  isMock: false,
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

// ── Mock qatlam ─────────────────────────────────────────────────────────
// EducationLevel, Nationality, Profession, SectionType va Question uchun
// backend'da hozircha endpoint yo'q (Question — faqat GET). Backend tayyor
// bo'lgach mockApi(...) chaqiruvlari realApi("...") ga almashtiriladi.

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const nowIso = () => new Date().toISOString();

const CREATED = "2026-03-12T14:02:00Z";
const UPDATED = "2026-06-18T09:31:00Z";

const seed = (items: Record<string, any>[]): RefItem[] =>
  items.map((it) => ({ id: uid(), created_at: CREATED, updated_at: UPDATED, ...it }));

const mockApi = (store: RefItem[], onRemove?: (item: RefItem) => void): RefApi => ({
  isMock: true,
  list: async (params) => {
    let items = store;
    if (params) {
      const { page, search, ...rest } = params;
      items = items.filter((item) =>
        Object.entries(rest).every(([key, val]) => String(item[key]) === String(val))
      );
      if (search) {
        const q = String(search).toLowerCase();
        items = items.filter((item) =>
          String(item.name || item.text || item.id || "").toLowerCase().includes(q)
        );
      }
      if (page) {
        const pageSize = 10;
        const start = (Number(page) - 1) * pageSize;
        items = items.slice(start, start + pageSize);
      }
    }
    return items.map((i) => ({ ...i }));
  },
  get: async (id) => {
    const item = store.find((i) => i.id === id);
    if (!item) throw new Error("Yozuv topilmadi");
    return { ...item };
  },
  create: async (data) => {
    const item: RefItem = { id: uid(), created_at: nowIso(), updated_at: nowIso(), ...data };
    store.push(item);
    return { ...item };
  },
  update: async (id, data) => {
    const item = store.find((i) => i.id === id);
    if (!item) throw new Error("Yozuv topilmadi");
    Object.assign(item, data, { updated_at: nowIso() });
    return { ...item };
  },
  remove: async (id) => {
    const idx = store.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error("Yozuv topilmadi");
    const [removed] = store.splice(idx, 1);
    onRemove?.(removed);
  },
});

const educationLevels = seed([
  { name: "O'rta" },
  { name: "O'rta maxsus" },
  { name: "Bakalavr" },
  { name: "Magistr" },
  { name: "PhD" },
]);

const nationalities = seed([
  { name: "O'zbek" },
  { name: "Qoraqalpoq" },
  { name: "Tojik" },
  { name: "Qozoq" },
  { name: "Rus" },
  { name: "Tatar" },
]);

const professions = seed([
  { name: "O'qituvchi" },
  { name: "Shifokor" },
  { name: "Dasturchi" },
  { name: "Muhandis" },
  { name: "Tadbirkor" },
  { name: "Haydovchi" },
]);

// Backend'da bo'limlar alohida jadval emas, enum sifatida mavjud
// (religious_spiritual, financial_governance, relatives_relations,
// character_crisis, future_plans) — shu qiymatlar seed qilingan.
const sections = seed([
  { name: "Din va qadriyatlar", code: "religious_spiritual" },
  { name: "Moliya va boshqaruv", code: "financial_governance" },
  { name: "Qarindoshlar", code: "relatives_relations" },
  { name: "Xarakter", code: "character_crisis" },
  { name: "Kelajak rejalari", code: "future_plans" },
]);

const sectionId = (code: string) => sections.find((s) => s.code === code)!.id;

const genericOptions = [
  { option_letter: "A", text: "Ha, albatta", weight: 4 },
  { option_letter: "B", text: "Ko'proq ha", weight: 3 },
  { option_letter: "C", text: "Vaziyatga qarab", weight: 2 },
  { option_letter: "D", text: "Yo'q", weight: 1 },
];

const questions = seed([
  {
    text: "Ibodatlar intizomi va e'tiqodiy muhit borasidagi amaliy holatingiz?",
    section: sectionId("religious_spiritual"),
    target_gender: "ALL",
    is_trap_question: false,
    order: 1,
    options: [
      { option_letter: "A", text: "5 vaqt namozni masjidda/vaqtida ado etaman", weight: 4 },
      { option_letter: "B", text: "Namozlarimni ado etishga harakat qilaman", weight: 3 },
      { option_letter: "C", text: "Ibodatlarni muntazam qilmayman", weight: 2 },
      { option_letter: "D", text: "Ibodat har kimning shaxsiy ishi", weight: 1 },
    ],
  },
  {
    text: "Diniy amal darajasi qanday?",
    section: sectionId("religious_spiritual"),
    target_gender: "ALL",
    is_trap_question: false,
    order: 2,
    options: genericOptions,
  },
  {
    text: "Nikoh marosimi qanday bo'lsin?",
    section: sectionId("religious_spiritual"),
    target_gender: "ALL",
    is_trap_question: false,
    order: 3,
    options: genericOptions,
  },
  {
    text: "Farzand tarbiyasida din o'rni",
    section: sectionId("religious_spiritual"),
    target_gender: "ALL",
    is_trap_question: false,
    order: 4,
    options: genericOptions,
  },
  {
    text: "Oilada moliyani kim boshqaradi?",
    section: sectionId("financial_governance"),
    target_gender: "ALL",
    is_trap_question: false,
    order: 7,
    options: genericOptions,
  },
  {
    text: "Qaynona bilan birga yashashga qanday qaraysiz?",
    section: sectionId("relatives_relations"),
    target_gender: "BRIDE",
    is_trap_question: false,
    order: 13,
    options: genericOptions,
  },
  {
    text: "Janjal paytida qanday yo'l tutasiz?",
    section: sectionId("character_crisis"),
    target_gender: "ALL",
    is_trap_question: true,
    order: 19,
    options: genericOptions,
  },
  {
    text: "Nikohdan keyin ishlashni rejalashtirasizmi?",
    section: sectionId("future_plans"),
    target_gender: "BRIDE",
    is_trap_question: false,
    order: 25,
    options: genericOptions,
  },
]);

// Bo'lim o'chirilsa, uning savollari ham o'chadi (cascade)
const sectionsApi = mockApi(sections, (removedSection) => {
  for (let i = questions.length - 1; i >= 0; i--) {
    if (questions[i].section === removedSection.id) questions.splice(i, 1);
  }
});

export const REF_APIS: Record<string, RefApi> = {
  roles: realApi("accounts/roles/"),
  regions: realApi("locations/region/"),
  districts: realApi("locations/district/"),
  "education-levels": realApi("references/education-levels/"),
  nationalities: realApi("references/nationalities/"),
  professions: realApi("references/professions/"),
  sections: realApi("accounts/section-types/"),
  questions: realApi("accounts/questions/"),
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
